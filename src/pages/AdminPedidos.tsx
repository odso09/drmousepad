import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Pedido = {
	id: string;
	creado_en?: string;
	nombre_cliente: string;
	email_cliente: string;
	url_imagen_final?: string | null;
	canvas_json?: any;
};

// Mapeo de tamaños a píxeles para exportación de alta resolución (aprox a 300 DPI sobre un lado)
const sizeToPixels = (tamano?: string): { w: number; h: number } => {
	if (!tamano) return { w: 3840, h: 1920 };
	const map: Record<string, { w: number; h: number }> = {
		"90×40 cm": { w: 10630, h: 4724 },
		"80×40 cm": { w: 9449, h: 4724 },
		"80×30 cm": { w: 9449, h: 3543 },
		"70×30 cm": { w: 8268, h: 3543 },
		"60×30 cm": { w: 7087, h: 3543 },
	};
	return map[tamano] || { w: 3840, h: 1920 };
};

// Renderizador de alta resolución a partir de canvas_json
async function renderHighRes(canvasJson: any, tamano?: string): Promise<Blob> {
	const { w, h } = sizeToPixels(tamano);
	const fabricNs = await import('fabric');
	// Forzar mejor calidad de escalado
	(fabricNs as any).configureLogging?.({});
	const canvas = new fabricNs.Canvas(undefined as any, {
		width: w,
		height: h,
		backgroundColor: (canvasJson?.backgroundColor || canvasJson?.background) ?? '#000',
		imageSmoothingEnabled: true,
		imageSmoothingQuality: 'high'
	} as any);

	await new Promise<void>((resolve, reject) => {
		try {
			canvas.loadFromJSON(canvasJson, () => resolve());
		} catch (e) { reject(e); }
	});

	// Asegurar que cada imagen tenga objectCaching para gran tamaño
	canvas.getObjects().forEach((o: any) => { if (o.type === 'image') o.objectCaching = true; });
	canvas.renderAll();
	const dataUrl = (canvas as any).toDataURL({ format: 'png', quality: 1 });
	const resp = await fetch(dataUrl);
	return await resp.blob();
}

export default function AdminPedidos() {
	const [pedidos, setPedidos] = useState<Pedido[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		(async () => {
			setLoading(true);
			const { data, error } = await supabase.from('pedidos').select('id, creado_en, nombre_cliente, email_cliente, url_imagen_final, canvas_json');
			if (error) {
				toast.error('No se pudieron cargar los pedidos');
			} else {
				setPedidos(data as any);
			}
			setLoading(false);
		})();
	}, []);

	const handleDownloadNormal = async (p: Pedido) => {
		if (!p.url_imagen_final) { toast.info('Sin imagen final'); return; }
		try {
			const resp = await fetch(p.url_imagen_final, { cache: 'no-store' });
			if (!resp.ok) throw new Error('fetch failed');
			const blob = await resp.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `pedido-${p.id}.png`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch {
			// Fallback: abrir en nueva pestaña si no se pudo forzar descarga
			try {
				window.open(p.url_imagen_final, '_blank');
			} catch {}
			toast.error('No se pudo forzar la descarga; se abrió la imagen.');
		}
	};

	const handleDownloadHighRes = async (p: Pedido) => {
		try {
			if (!p.canvas_json) { toast.info('Sin canvas_json para alta resolución'); return; }
			// intentar deducir tamaño del producto principal si existe
			const { data: productos } = await supabase.from('pedido_productos').select('tamano').eq('pedido_id', p.id).limit(1);
			const tamano = productos && productos[0]?.tamano;
			const blob = await renderHighRes(p.canvas_json, tamano);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `pedido-${p.id}-alta.png`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (e) {
			toast.error('No se pudo generar alta resolución');
		}
	};

	const handleLogout = () => {
		localStorage.removeItem('admin_auth');
		toast.success('Sesión cerrada');
		window.location.href = '/admin/login';
	};

	return (
		<section className="container py-8">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-bold">Pedidos</h1>
				<Button variant="outline" onClick={handleLogout}>Salir</Button>
			</div>
			{loading && <p>Cargando...</p>}
			{!loading && pedidos.length === 0 && <p>No hay pedidos.</p>}
			<div className="space-y-3">
				{pedidos.map((p) => (
					<div key={p.id} className="border rounded p-3 flex items-center justify-between gap-4">
						<div className="flex items-center gap-4 min-w-0">
							<div className="w-[140px] h-[80px] bg-muted/40 rounded overflow-hidden border">
								<img
									loading="lazy"
									src={p.url_imagen_final || "/placeholder.svg"}
									alt={`Pedido ${p.id}`}
									className="w-full h-full object-cover"
								/>
							</div>
							<div className="truncate">
								<div className="font-semibold truncate">{p.nombre_cliente}</div>
								<div className="text-sm text-muted-foreground truncate">{p.email_cliente}</div>
							</div>
						</div>
						<div className="flex gap-2">
							<Button onClick={() => handleDownloadNormal(p)}>Descargar normal</Button>
							<Button variant="secondary" onClick={() => handleDownloadHighRes(p)}>Descargar alta resolución</Button>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

