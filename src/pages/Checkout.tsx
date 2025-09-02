import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Fix icon issue for leaflet in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({
	iconUrl,
	shadowUrl: iconShadow,
});


const Checkout = () => {
	const { items, total, clear } = useCart();
	const [form, setForm] = useState({
		nombre: "",
		email: "",
		telefono: "",
		direccion: "",
		observacion: "",
	});
	const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
	const [enviando, setEnviando] = useState(false);
	const [mensaje, setMensaje] = useState("");

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
				<Marker position={ubicacion} icon={L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] })} />
			);
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
				<input
					type="text"
					name="nombre"
					placeholder="Nombre completo"
					value={form.nombre}
					onChange={handleChange}
					required
					className="w-full border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-zinc-900"
				/>
				<input
					type="email"
					name="email"
					placeholder="Correo electrónico"
					value={form.email}
					onChange={handleChange}
					required
					className="w-full border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-zinc-900"
				/>
				<input
					type="tel"
					name="telefono"
					placeholder="Teléfono"
					value={form.telefono}
					onChange={handleChange}
					required
					className="w-full border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-zinc-900"
				/>
				<input
					type="text"
					name="direccion"
					placeholder="Dirección de entrega"
					value={form.direccion}
					onChange={handleChange}
					required
					className="w-full border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-zinc-900"
				/>
				<textarea
					name="observacion"
					placeholder="Observaciones (opcional)"
					value={form.observacion}
					onChange={handleChange}
					className="w-full border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-zinc-900"
				/>
				 <div className="my-4">
					 <label className="block mb-2 font-medium">Coloca tu ubicación en el mapa (opcional)</label>
							 <MapContainer center={[-25.2637, -57.5759]} zoom={13} style={{ height: 220, width: '100%', borderRadius: 12 } as React.CSSProperties}>
								 <TileLayer
									 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
									 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
								 />
								 <LocationMarker />
							 </MapContainer>
					 {ubicacion && (
						 <div className="text-xs mt-2 text-muted-foreground">Lat: {ubicacion.lat.toFixed(6)}, Lng: {ubicacion.lng.toFixed(6)}</div>
					 )}
				 </div>
				 <button
					 type="submit"
					 disabled={enviando}
					 className="btn-hero text-sm px-3 py-2 w-full flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-cyan-400"
					 aria-label="Continuar"
				 >
					 <span className="material-icons" style={{ fontSize: '1.1em' }}></span>
					 {enviando ? "Enviando..." : "Continuar"}
				 </button>
				{mensaje && <div className="text-green-600 font-semibold mt-2">{mensaje}</div>}
			</form>
		</div>
	);
};

export default Checkout;
