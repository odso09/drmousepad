import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Producto = {
	id: number;
	tamano: string;
	url_imagen_final: string | null;
};

type Pedido = {
	id: number;
	creado_en?: string;
	nombre_cliente: string;
	email_cliente: string;
	productos: Producto[];
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

// Renderizador de alta resolución a partir de canvas_json (usando multiplier)
async function renderHighRes(rawJson: any, tamano?: string): Promise<Blob> {
	const fabricNs = await import('fabric');
	const canvasJson = JSON.parse(JSON.stringify(rawJson || {})); // copia defensiva
	const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGP4BwQACfsD/qBDnV8AAAAASUVORK5CYII=';

	// Reparar imágenes con blob: expirado sustituyéndolas por pixel transparente (evita fallo total)
	if (Array.isArray(canvasJson?.objects)) {
		for (const obj of canvasJson.objects) {
			if (obj.type === 'image' && typeof obj.src === 'string' && obj.src.startsWith('blob:')) {
				obj.src = TRANSPARENT_PIXEL;
			}
		}
	}

	// Detectar dimensiones originales del canvas
	const origW = canvasJson?.width || canvasJson?.w ||  (canvasJson?.objects?.length ? Math.max(...canvasJson.objects.filter((o:any)=>o.left!=null && o.width!=null).map((o:any)=> (o.left||0) + (o.width||0))) : 960) || 960;
	const origH = canvasJson?.height || canvasJson?.h ||  (canvasJson?.objects?.length ? Math.max(...canvasJson.objects.filter((o:any)=>o.top!=null && o.height!=null).map((o:any)=> (o.top||0) + (o.height||0))) : 480) || 480;

	const target = sizeToPixels(tamano);
	const mult = Math.min( Math.max( (target.w / origW), 2), 8 ); // mínimo 2x, máximo 8x por seguridad

	const canvas = new fabricNs.Canvas(undefined as any, {
		width: origW,
		height: origH,
		backgroundColor: (canvasJson?.backgroundColor || canvasJson?.background) ?? '#000',
		imageSmoothingEnabled: true,
		imageSmoothingQuality: 'high'
	} as any);

	await new Promise<void>((resolve, reject) => {
		try {
			canvas.loadFromJSON(canvasJson, () => resolve());
		} catch (e) { reject(e); }
	});

	canvas.getObjects().forEach((o: any) => { if (o.type === 'image') o.objectCaching = true; });
	canvas.renderAll();

	// Exportar con multiplier calculado
	let dataUrl: string;
	try {
		dataUrl = (canvas as any).toDataURL({ format: 'png', multiplier: mult });
	} catch {
		dataUrl = (canvas as any).toDataURL({ format: 'png' });
	}
	const resp = await fetch(dataUrl);
	return await resp.blob();
}

export default function AdminPedidos() {
	const [pedidos, setPedidos] = useState<Pedido[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		(async () => {
			setLoading(true);
			const { data, error } = await supabase
				.from('pedidos')
				.select('id, creado_en, nombre_cliente, email_cliente, pedido_productos(id, tamano, url_imagen_final)')
				.order('creado_en', { ascending: false });
			if (error) {
				toast.error('No se pudieron cargar los pedidos');
			} else {
				// Mapear productos a un array más limpio
				const pedidosConProductos = (data as any[]).map((p) => ({
					id: p.id,
					creado_en: p.creado_en,
					nombre_cliente: p.nombre_cliente,
					email_cliente: p.email_cliente,
					productos: (p.pedido_productos || []).map((prod: any) => ({
						id: prod.id,
						tamano: prod.tamano,
						url_imagen_final: prod.url_imagen_final,
					})),
				}));
				setPedidos(pedidosConProductos);
			}
			setLoading(false);
		})();
	}, []);

	const handleDownloadImage = async (url: string, productoId: number) => {
		try {
			const resp = await fetch(url, { cache: 'no-store' });
			if (!resp.ok) throw new Error('fetch failed');
			const blob = await resp.blob();
			const objUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = objUrl;
			a.download = `producto-${productoId}.png`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(objUrl);
			toast.success('Imagen descargada');
		} catch {
			// Fallback: abrir en nueva pestaña si no se pudo forzar descarga
			window.open(url, '_blank');
			toast.error('No se pudo forzar la descarga; se abrió la imagen.');
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
					<div key={p.id} className="border rounded p-3">
						<div className="flex items-center gap-4 min-w-0 mb-2">
							<div className="font-semibold truncate">{p.nombre_cliente}</div>
							<div className="text-sm text-muted-foreground truncate">{p.email_cliente}</div>
						</div>
						<div className="flex flex-wrap gap-4">
							{p.productos.length === 0 && <span className="text-muted-foreground">Sin productos</span>}
							{p.productos.map((prod) => (
								<div key={prod.id} className="border rounded p-2 flex flex-col items-center min-w-[120px]">
									<div className="w-[100px] h-[60px] bg-muted/40 rounded overflow-hidden border mb-1">
										<img
											loading="lazy"
											src={prod.url_imagen_final || "/placeholder.svg"}
											alt={`Producto ${prod.id}`}
											className="w-full h-full object-cover"
										/>
									</div>
									<div className="text-xs font-medium mb-1">{prod.tamano}</div>
									{prod.url_imagen_final ? (
										<button
											onClick={() => handleDownloadImage(prod.url_imagen_final!, prod.id)}
											className="text-blue-600 hover:underline text-xs cursor-pointer bg-transparent border-none p-0"
										>
											Descargar imagen
										</button>
									) : (
										<span className="text-muted-foreground text-xs">Sin imagen</span>
									)}
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

