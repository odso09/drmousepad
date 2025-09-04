import React, { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Fix icon issue for leaflet in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({
	iconUrl,
	iconRetinaUrl,
	shadowUrl: iconShadow,
});

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
// Apply globally so all <Marker> use it by default
(L.Marker as any).prototype.options.icon = defaultIcon;


const Checkout = () => {
	const { items, total, clear } = useCart();
	const [form, setForm] = useState({
		nombre: "",
		email: "",
		telefono: "",
		direccion: "",
		observacion: "",
	});
	const DEFAULT_CENTER = { lat: -25.319822, lng: -57.562523 };
	const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(DEFAULT_CENTER);
	const [enviando, setEnviando] = useState(false);
	const [mensaje, setMensaje] = useState("");
	// Autocompletado de dirección
	const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [loadingAddr, setLoadingAddr] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	// Componente para seleccionar ubicación en el mapa
	function LocationMarker() {
		useMapEvents({
			click(e) {
				setUbicacion(e.latlng);
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
					}
				}}
			/>
		);
	}

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

	// Recentrar el mapa cuando cambia la ubicación
	function RecenterOnLocation({ center }: { center: { lat: number; lng: number } | null }) {
		const map = useMap();
		useEffect(() => {
			if (center) {
				const targetZoom = Math.max(map.getZoom(), 13);
				map.setView(center, targetZoom, { animate: true });
			}
		}, [center, map]);
		return null;
	}

		const handleSubmit = async (e: React.FormEvent) => {
			e.preventDefault();
			setEnviando(true);
			setMensaje("");
			try {
				const { error } = await supabase.from("pedidos").insert([
					{
						nombre_cliente: form.nombre,
						email_cliente: form.email,
						telefono_cliente: form.telefono,
						direccion_cliente: form.direccion,
						observacion_cliente: form.observacion,
						latitud: ubicacion?.lat ?? null,
						longitud: ubicacion?.lng ?? null,
						carrito: items.map(i => ({ ...i, data: i.data })),
						estado: "pendiente",
						metodo_pago: "pendiente",
						estado_pago: "pendiente",
						monto_pagado: 0,
						pago_total: false
					}
				]);
				if (error) throw error;
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
				<input
					type="text"
					name="nombre"
					id="nombre"
					placeholder="Nombre completo"
					value={form.nombre}
					onChange={handleChange}
					required
					autoComplete="name"
					className="w-full border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-zinc-900"
				/>
				<label htmlFor="email" className="sr-only">Correo electrónico</label>
				<input
					type="email"
					name="email"
					id="email"
					placeholder="Correo electrónico"
					value={form.email}
					onChange={handleChange}
					required
					autoComplete="email"
					className="w-full border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-zinc-900"
				/>
				<label htmlFor="telefono" className="sr-only">Teléfono</label>
				<input
					type="tel"
					name="telefono"
					id="telefono"
					placeholder="Teléfono"
					value={form.telefono}
					onChange={handleChange}
					required
					autoComplete="tel"
					className="w-full border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-zinc-900"
				/>
				<label htmlFor="direccion" className="sr-only">Dirección de entrega</label>
				<input
					type="text"
					name="direccion"
					id="direccion"
					placeholder="Dirección de entrega"
					value={form.direccion}
					onChange={(e) => { handleChange(e); setShowSuggestions(true); }}
					required
					autoComplete="street-address"
					className="w-full border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-zinc-900"
					onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
				/>
				{showSuggestions && (loadingAddr || suggestions.length > 0) && (
					<ul role="listbox" className="border rounded mt-1 max-h-56 overflow-auto bg-card shadow-sm">
						{loadingAddr && (
							<li className="px-3 py-2 text-sm text-muted-foreground">Buscando...</li>
						)}
						{suggestions.map((s, idx) => (
							<li key={`${s.lat}-${s.lon}-${idx}`}>
								<button
									type="button"
									className="block w-full text-left px-3 py-2 hover:bg-muted"
									onClick={() => {
										setForm({ ...form, direccion: s.display_name });
										setUbicacion({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
										setShowSuggestions(false);
									}}
								>
									{s.display_name}
								</button>
							</li>
						))}
					</ul>
				)}
				<label htmlFor="observacion" className="sr-only">Observaciones</label>
				<textarea
					name="observacion"
					id="observacion"
					placeholder="Observaciones (opcional)"
					value={form.observacion}
					onChange={handleChange}
					className="w-full border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-zinc-900"
				/>

				<div className="my-4" role="group" aria-labelledby="map-label">
					<label id="map-label" className="block mb-2 font-medium">Coloca tu ubicación en el mapa (opcional)</label>
					<MapContainer center={DEFAULT_CENTER} zoom={13} style={{ height: 220, width: '100%', borderRadius: 12 } as React.CSSProperties}>
						<TileLayer
							attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						/>
						<LocationMarker />
						<RecenterOnLocation center={ubicacion} />
					</MapContainer>
					{ubicacion && (
						<div className="text-xs mt-2 text-muted-foreground">Lat: {ubicacion.lat.toFixed(6)}, Lng: {ubicacion.lng.toFixed(6)}</div>
					)}
				</div>
						<button
							type="submit"
							disabled={enviando}
							className="btn-hero-static text-sm px-3 py-2 w-full flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-cyan-400"
						>
							<span className="material-icons" style={{ fontSize: '1.1em' }} aria-hidden="true"></span>
							{enviando ? "Enviando..." : "Continuar"}
						</button>
						{mensaje && <div className="text-green-600 font-semibold mt-2" role="status" aria-live="polite">{mensaje}</div>}
					</form>
		</div>
	);
};

export default Checkout;
