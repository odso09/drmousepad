import React, { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { getImageBlob } from "@/lib/idb";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Fix icon issue for leaflet in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl: iconShadow });

// Define and set a default marker icon explicitly to avoid broken image issues in bundlers
const defaultIcon = L.icon({
	iconRetinaUrl,
	iconUrl,
	shadowUrl: iconShadow,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	tooltipAnchor: [16, -28],
	shadowSize: [41, 41],
});
(L.Marker as any).prototype.options.icon = defaultIcon;

const Checkout = () => {
	const { items, total, clear } = useCart();
	const [form, setForm] = useState({ nombre: "", email: "", telefono: "", direccion: "", observacion: "" });
	const DEFAULT_CENTER = { lat: -25.319822, lng: -57.562523 };
	const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(DEFAULT_CENTER);
	const [shouldRecenter, setShouldRecenter] = useState(false);
	const [geolocating, setGeolocating] = useState(false);
	const [enviando, setEnviando] = useState(false);
	const [mensaje, setMensaje] = useState("");
	const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [loadingAddr, setLoadingAddr] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	function LocationMarker() {
		useMapEvents({
			click(e) {
				setUbicacion(e.latlng);
				setShouldRecenter(false);
			},
		});
		return ubicacion === null ? null : (
			<Marker
				position={ubicacion}
				draggable
				eventHandlers={{
					dragend: (e) => {
						const m = e.target as L.Marker;
						const pos = m.getLatLng();
						setUbicacion({ lat: pos.lat, lng: pos.lng });
						setShouldRecenter(false);
					}
				}}
			/>
		);
	}

	// Solicitar ubicación del navegador y recentrar el mapa
	const requestGeolocation = (options?: { silent?: boolean }) => {
		if (!('geolocation' in navigator)) {
			if (!options?.silent) console.warn('Geolocalización no soportada');
			return;
		}
		setGeolocating(true);
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const { latitude, longitude } = pos.coords;
				setUbicacion({ lat: latitude, lng: longitude });
				setShouldRecenter(true);
				setGeolocating(false);
			},
			(err) => {
				if (!options?.silent) console.warn('No se pudo obtener la ubicación', err);
				setGeolocating(false);
			},
			{ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
		);
	};

	// Intento automático al montar (el navegador pedirá permiso). HTTPS/localhost requerido
	useEffect(() => {
		requestGeolocation({ silent: true });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Buscar sugerencias cuando cambia la dirección (con debounce)
	useEffect(() => {
		const q = form.direccion.trim();
		if (q.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
		setLoadingAddr(true);
		const controller = new AbortController();
		const t = window.setTimeout(async () => {
			try {
				const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=py&q=${encodeURIComponent(q)}`;
				const resp = await fetch(url, { signal: controller.signal, headers: { 'Accept-Language': 'es' } });
				if (!resp.ok) throw new Error('geo lookup failed');
				const data = await resp.json();
				setSuggestions(Array.isArray(data) ? data : []);
				setShowSuggestions(true);
			} catch (_) {
				// ignora errores de red/cancelación
			} finally {
				setLoadingAddr(false);
			}
		}, 300);
		return () => { clearTimeout(t); controller.abort(); };
	}, [form.direccion]);

	function RecenterOnLocation({ center, enabled, onDone }: { center: { lat: number; lng: number } | null; enabled: boolean; onDone?: () => void }) {
		const map = useMap();
		useEffect(() => {
			if (enabled && center) {
				const targetZoom = Math.max(map.getZoom(), 13);
				map.setView(center, targetZoom, { animate: true });
				onDone?.();
			}
		}, [enabled, center, map, onDone]);
		return null;
	}

	// Convierte un dataURL a Blob
	const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
		const res = await fetch(dataUrl);
		return await res.blob();
	};

		// Derivar extensión a partir del tipo MIME
		const mimeToExt = (mime?: string) => {
			if (!mime) return 'png';
			if (mime.includes('jpeg')) return 'jpg';
			if (mime.includes('png')) return 'png';
			if (mime.includes('webp')) return 'webp';
			return 'png';
		};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setEnviando(true);
		setMensaje("");
		try {
			if (!items || items.length === 0) {
				setMensaje("Tu carrito está vacío.");
				setEnviando(false);
				return;
			}

			// 1) Insertar pedido y obtener su id
			const pedidoRes = await supabase
				.from('pedidos')
				.insert([
					{
						nombre_cliente: form.nombre,
						email_cliente: form.email,
						telefono_cliente: form.telefono,
						direccion_cliente: form.direccion,
						observacion_cliente: form.observacion,
						latitud: ubicacion?.lat ?? null,
						longitud: ubicacion?.lng ?? null,
						estado: 'pendiente',
						metodo_pago: 'pendiente',
						estado_pago: 'pendiente',
						monto_pagado: 0,
						pago_total: false,
					}
				])
				.select('id')
				.single();
			if (pedidoRes.error) throw pedidoRes.error;
			const pedidoId: string = pedidoRes.data.id;

			// 2) Subir imagen final del primer item
			let publicUrl: string | null = null;
			const first = items[0];
			const thumb = (first?.data as any)?.thumbnail as string | undefined;
			if (thumb && thumb.startsWith('data:')) {
				try {
					const blob = await dataUrlToBlob(thumb);
					const path = `pedidos/${pedidoId}/final.png`;
					const { error: upErr } = await supabase.storage.from('designs').upload(path, blob, { contentType: 'image/png', upsert: true });
					if (upErr) throw upErr;
					const { data } = supabase.storage.from('designs').getPublicUrl(path);
					publicUrl = data?.publicUrl ?? null;
				} catch {
					publicUrl = null;
				}
			}

			// 3) Actualizar pedido con URL final y canvas_json
			const canvasJson = (first as any)?.canvasJson ?? null;
			await supabase.from('pedidos').update({ url_imagen_final: publicUrl, canvas_json: canvasJson }).eq('id', pedidoId);

			// 4) Insertar productos
			const productosPayload = items.map((i) => ({
				pedido_id: pedidoId,
				tamano: (i.data as any)?.size ?? null,
				rgb: !!(i.data as any)?.rgb,
				logo_eliminado: !!(i.data as any)?.logo?.removed,
				posicion_logo: (i.data as any)?.logo?.position ?? null,
				color_fondo: (i.data as any)?.backgroundColor ?? null,
				precio_base: (i.data as any)?.basePrice ?? null,
				total: (i.data as any)?.total ?? null,
				cantidad: (i as any).quantity ?? 1,
			}));
					const prodInsert = await supabase.from('pedido_productos').insert(productosPayload).select('id');
					if (prodInsert.error) throw prodInsert.error;
					const productoIds: string[] = (prodInsert.data as any[]).map(r => r.id);

					// 5) Por cada producto: subir imágenes a Storage y registrar en producto_imagenes
					for (let idx = 0; idx < items.length; idx++) {
						const prodId = productoIds[idx];
						const item = items[idx] as any;
						const images: Array<{ id?: string; url?: string; props?: any }> = item?.data?.images || [];
						const imageRows: Array<any> = [];
						for (let i = 0; i < images.length; i++) {
							const im = images[i];
							let storageUrl: string | null = null;
							// Intentar obtener blob desde IndexedDB si hay id
							let blob: Blob | null = null;
							if (im.id) {
								try { blob = await getImageBlob(im.id) as Blob; } catch { blob = null; }
							}
							// Si no hay blob pero hay url, intentar fetch
							if (!blob && im.url) {
								try {
									const resp = await fetch(im.url);
									if (resp.ok) blob = await resp.blob();
								} catch {
									// ignorar
								}
							}
							if (blob) {
								try {
									const ext = mimeToExt(blob.type);
									const path = `pedidos/${pedidoId}/productos/${prodId}/imagenes/${Date.now()}_${i}.${ext}`;
									const { error: upErr } = await supabase.storage.from('designs').upload(path, blob, { contentType: blob.type || 'image/png', upsert: true });
									if (!upErr) {
										const { data } = supabase.storage.from('designs').getPublicUrl(path);
										storageUrl = data?.publicUrl ?? null;
									}
								} catch {
									// continuar a fallback
								}
							}
							// Fallback: si no se pudo subir pero teníamos una url (remota), usarla para no perder referencia
							if (!storageUrl && im.url) storageUrl = im.url;
							if (storageUrl) {
								imageRows.push({ producto_id: prodId, url_storage: storageUrl, props: im.props || null });
							}
						}
						if (imageRows.length) {
							// Insertar filas de imagenes para este producto
							await supabase.from('producto_imagenes').insert(imageRows);
						}

						// 6) Registrar textos del producto en producto_textos
						const texts: Array<any> = item?.data?.texts || [];
						if (texts.length) {
							const textRows = texts.map((t: any) => ({
								producto_id: prodId,
								contenido: t.content,
								fuente: t.font,
								color_relleno: t.fill,
								tamano_fuente: t.fontSize,
								left: t.left,
								top: t.top,
								escala_x: t.scaleX,
								escala_y: t.scaleY,
								angulo: t.angle,
								ancho: t.width,
								alto: t.height,
								origen_x: t.originX,
								origen_y: t.originY,
							}));
							await supabase.from('producto_textos').insert(textRows);
						}
					}

			setMensaje("¡Pedido enviado correctamente!");
			clear();
		} catch (err: any) {
			setMensaje("Error al guardar el pedido. Intenta de nuevo.");
		} finally {
			setEnviando(false);
		}
	};

	return (
		<div className="max-w-md mx-auto p-4">
			<h1
				className="text-2xl font-bold mb-4"
				style={{
					background: 'linear-gradient(90deg, #22d3ee 0%, #a78bfa 100%)',
					WebkitBackgroundClip: 'text',
					WebkitTextFillColor: 'transparent',
					backgroundClip: 'text',
					color: 'transparent',
				}}
			>
				Datos para tu pedido
			</h1>
			<form onSubmit={handleSubmit} className="space-y-4">
				<label htmlFor="nombre" className="sr-only">Nombre completo</label>
				<input type="text" name="nombre" id="nombre" placeholder="Nombre completo" value={form.nombre} onChange={handleChange} required autoComplete="name" className="w-full border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-zinc-900" />
				<label htmlFor="email" className="sr-only">Correo electrónico</label>
				<input type="email" name="email" id="email" placeholder="Correo electrónico" value={form.email} onChange={handleChange} required autoComplete="email" className="w-full border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-zinc-900" />
				<label htmlFor="telefono" className="sr-only">Teléfono</label>
				<input type="tel" name="telefono" id="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} required autoComplete="tel" className="w-full border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-zinc-900" />
				<label htmlFor="direccion" className="sr-only">Dirección de entrega</label>
				<input type="text" name="direccion" id="direccion" placeholder="Dirección de entrega" value={form.direccion} onChange={(e) => { handleChange(e); setShowSuggestions(true); }} required autoComplete="street-address" className="w-full border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-zinc-900" onFocus={() => { if (suggestions.length) setShowSuggestions(true); }} />
				{showSuggestions && (loadingAddr || suggestions.length > 0) && (
					<ul role="listbox" className="border rounded mt-1 max-h-56 overflow-auto bg-card shadow-sm">
						{loadingAddr && (<li className="px-3 py-2 text-sm text-muted-foreground">Buscando...</li>)}
						{suggestions.map((s, idx) => (
							<li key={`${s.lat}-${s.lon}-${idx}`}>
								<button type="button" className="block w-full text-left px-3 py-2 hover:bg-muted" onClick={() => { setForm({ ...form, direccion: s.display_name }); setUbicacion({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) }); setShowSuggestions(false); setShouldRecenter(true); }}>
									{s.display_name}
								</button>
							</li>
						))}
					</ul>
				)}
				<label htmlFor="observacion" className="sr-only">Observaciones</label>
				<textarea name="observacion" id="observacion" placeholder="Observaciones (opcional)" value={form.observacion} onChange={handleChange} className="w-full border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-zinc-900" />

				<div className="my-4" role="group" aria-labelledby="map-label">
					<label id="map-label" className="block mb-2 font-medium">Coloca tu ubicación en el mapa (opcional)</label>
					<div className="relative">
						<MapContainer center={DEFAULT_CENTER} zoom={13} style={{ height: 220, width: '100%', borderRadius: 12 } as React.CSSProperties}>
						<TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
						<LocationMarker />
						<RecenterOnLocation center={ubicacion} enabled={shouldRecenter} onDone={() => setShouldRecenter(false)} />
						</MapContainer>
						<button
							type="button"
							onClick={() => requestGeolocation()}
							disabled={geolocating}
							className="absolute top-2 right-2 z-[1000] bg-black/70 text-white text-xs px-2 py-1 rounded hover:bg-black/80 disabled:opacity-60"
							aria-label="Usar mi ubicación actual"
						>
							{geolocating ? 'Ubicando…' : 'Usar mi ubicación'}
						</button>
					</div>
					{ubicacion && (<div className="text-xs mt-2 text-muted-foreground">Lat: {ubicacion.lat.toFixed(6)}, Lng: {ubicacion.lng.toFixed(6)}</div>)}
				</div>
				<button type="submit" disabled={enviando} className="btn-hero-static text-sm px-3 py-2 w-full flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-cyan-400">
					<span className="material-icons" style={{ fontSize: '1.1em' }} aria-hidden="true"></span>
					{enviando ? "Enviando..." : "Continuar"}
				</button>
				{mensaje && <div className="text-green-600 font-semibold mt-2" role="status" aria-live="polite">{mensaje}</div>}
			</form>
		</div>
	);
};

export default Checkout;
