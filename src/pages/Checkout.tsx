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
	const [progress, setProgress] = useState(0); // 0-100
	const [showProgress, setShowProgress] = useState(false);
	const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [loadingAddr, setLoadingAddr] = useState(false);
	const [phase, setPhase] = useState('Preparando datos');

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

	// Mapeo de tamaños a píxeles para alta resolución (300 DPI aproximado)
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

	// Renderizar canvas en alta resolución
	const renderHighRes = async (canvasJson: any, tamano: string, imageIds: string[]): Promise<Blob> => {
		const fabricNs = await import('fabric');
		const { getImageBlob } = await import('@/lib/idb');
		
		console.log('🎨 Iniciando renderHighRes:', { tamano, imageIds, objectsCount: canvasJson?.objects?.length });
		
		// Log detallado de todos los objetos
		if (Array.isArray(canvasJson?.objects)) {
			canvasJson.objects.forEach((obj: any, idx: number) => {
				console.log(`  📦 Objeto ${idx}:`, { 
					type: obj.type, 
					srcType: obj.src ? (obj.src.startsWith('data:') ? 'dataURL' : obj.src.startsWith('blob:') ? 'blob' : obj.src.startsWith('http') ? 'http' : 'otro') : 'sin src',
					srcPreview: obj.src?.substring(0, 60)
				});
			});
		}
		
		// Restaurar imágenes desde IndexedDB (convertir blob a dataURL)
		if (Array.isArray(canvasJson?.objects) && imageIds.length > 0) {
			let imgIndex = 0;
			for (const obj of canvasJson.objects) {
				if (obj.type === 'image' && typeof obj.src === 'string') {
					console.log('🖼️ Procesando imagen:', { type: obj.type, srcType: obj.src.substring(0, 20) });
					// Solo restaurar si es una blob: URL expirada
					if (obj.src.startsWith('blob:')) {
						const imageId = imageIds[imgIndex];
						if (imageId) {
							try {
								const blob = await getImageBlob(imageId);
								if (blob) {
									// Convertir blob a dataURL para Fabric.js
									const dataUrl = await new Promise<string>((resolve) => {
										const reader = new FileReader();
										reader.onloadend = () => resolve(reader.result as string);
										reader.readAsDataURL(blob);
									});
									obj.src = dataUrl;
									console.log('✅ Imagen restaurada desde IndexedDB');
								}
							} catch (err) {
								console.warn('❌ Error recuperando imagen desde IndexedDB:', err);
							}
						}
						imgIndex++;
					}
					// Si ya es dataURL o URL normal (como el logo), dejarla tal cual
				}
			}
		}

		// Detectar dimensiones originales del canvas
		// IMPORTANTE: Usar la proporción correcta según el tamaño seleccionado, no las dimensiones del JSON
		// El JSON puede tener dimensiones antiguas si el usuario cambió el tamaño después de cargar
		const canvasJsonW = canvasJson?.width || 960;
		const canvasJsonH = canvasJson?.height || 480;
		
		// Calcular proporción correcta según el tamaño de mousepad seleccionado
		const parseSize = (s: string) => {
			const [w, h] = s.replace(" cm", "").split("×").map((n) => parseInt(n));
			return { w, h };
		};
		const { w: realW, h: realH } = parseSize(tamano);
		const correctRatio = realW / realH;
		
		// Usar ancho del JSON pero recalcular alto con la proporción correcta
		const origW = canvasJsonW;
		const origH = Math.round(canvasJsonW / correctRatio);
		
		const target = sizeToPixels(tamano);

		console.log('📐 Dimensiones canvas:', { 
			jsonDims: `${canvasJsonW}×${canvasJsonH}`,
			correctDims: `${origW}×${origH}`,
			ratio: correctRatio.toFixed(2),
			targetW: target.w, 
			targetH: target.h 
		});

		const canvas = new fabricNs.Canvas(undefined as any, {
			width: origW,
			height: origH,
			backgroundColor: canvasJson?.backgroundColor ?? '#000',
			imageSmoothingEnabled: true,
			imageSmoothingQuality: 'high'
		} as any);

		// Cargar el JSON y esperar a que todas las imágenes se carguen
		await new Promise<void>((resolve, reject) => {
			try {
				canvas.loadFromJSON(canvasJson, () => {
					console.log('✅ JSON cargado en canvas');
					// Dar tiempo para que las imágenes se carguen completamente
					setTimeout(() => resolve(), 100);
				});
			} catch (e) { 
				console.error('❌ Error cargando JSON:', e);
				reject(e); 
			}
		});

		// Asegurar que todas las imágenes estén cargadas
		const images = canvas.getObjects().filter((o: any) => o.type === 'image') as any[];
		console.log('🖼️ Imágenes en canvas:', images.length);
		
		await Promise.all(images.map((img: any, idx: number) => {
			return new Promise<void>((resolve) => {
				const el = img._element;
				if (el && el.complete) {
					console.log(`✅ Imagen ${idx} ya cargada`);
					resolve();
				} else if (el) {
					el.onload = () => {
						console.log(`✅ Imagen ${idx} cargada`);
						resolve();
					};
					el.onerror = () => {
						console.warn(`⚠️ Error cargando imagen ${idx}`);
						resolve();
					};
				} else {
					console.warn(`⚠️ Imagen ${idx} sin elemento`);
					resolve();
				}
			});
		}));

		// AHORA sí podemos detectar las dimensiones reales de las imágenes cargadas
		let maxImageResolution = 0;
		let maxNaturalW = 0;
		let maxNaturalH = 0;
		
		for (const img of images) {
			const el: HTMLImageElement | undefined = img._element || img._originalElement;
			const src: string = el?.src || '';
			
			// Ignorar el logo, solo procesar imágenes del usuario
			if (el && !src.includes('logo.png')) {
				const naturalW = el.naturalWidth || el.width || 0;
				const naturalH = el.naturalHeight || el.height || 0;
				const resolution = naturalW * naturalH;
				
				if (resolution > maxImageResolution) {
					maxImageResolution = resolution;
					maxNaturalW = naturalW;
					maxNaturalH = naturalH;
					console.log('🖼️ Imagen de usuario detectada:', { 
						naturalW, 
						naturalH, 
						resolution: Math.round(resolution / 1000000) + 'MP',
						canvasW: Math.round(img.width * img.scaleX),
						canvasH: Math.round(img.height * img.scaleY)
					});
				}
			}
		}
		
		// Calcular multiplicador basado en la resolución REAL de la imagen del usuario
		let mult: number;
		if (maxImageResolution > 0 && maxNaturalW > 0 && maxNaturalH > 0) {
			// La imagen en el canvas puede estar escalada. Necesitamos saber cuánto
			// ocupa en el canvas vs su tamaño natural para calcular el multiplicador ideal
			const canvasResolution = origW * origH;
			
			// Calcular qué multiplicador llevaría el canvas a tener la misma densidad de píxeles
			// que la imagen original del usuario
			const naturalMult = Math.sqrt(maxImageResolution / canvasResolution);
			
			// IMPORTANTE: Mínimo 5x para garantizar calidad de impresión profesional
			// Máximo 8x para mantener balance entre calidad y peso
			mult = Math.min(Math.max(naturalMult, 5), 8);
			
			const finalW = Math.round(origW * mult);
			const finalH = Math.round(origH * mult);
			
			console.log('🎯 Multiplicador calculado:', { 
				imagenOriginal: `${maxNaturalW}x${maxNaturalH}`,
				canvasFinal: `${finalW}x${finalH}`,
				naturalMult: naturalMult.toFixed(2), 
				finalMult: mult.toFixed(2),
				motivo: naturalMult < 5 ? '⚠️ imagen pequeña, usando 5x MÍNIMO para calidad de impresión' : 
				        naturalMult > 8 ? 'imagen muy grande, limitado a 8x' : 
				        '✅ multiplicador exacto para mantener calidad original'
			});
		} else {
			// Fallback: usar multiplicador para buena calidad de impresión
			mult = 5;
			console.log('⚠️ No se detectó imagen de usuario, usando multiplicador estándar 5x para impresión');
		}

		canvas.getObjects().forEach((o: any) => { if (o.type === 'image') o.objectCaching = true; });
		
		// Log detallado de posiciones ANTES de escalar
		console.log('📍 Posiciones de objetos en canvas (ANTES de escalar):');
		canvas.getObjects().forEach((obj: any, idx: number) => {
			console.log(`  Objeto ${idx} (${obj.type}):`, {
				left: obj.left,
				top: obj.top,
				width: obj.width,
				height: obj.height,
				scaleX: obj.scaleX,
				scaleY: obj.scaleY,
				originX: obj.originX,
				originY: obj.originY
			});
		});
		
		// NUEVA ESTRATEGIA: Escalar el canvas directamente en lugar de usar multiplier en toDataURL
		// Esto evita problemas de redondeo y desalineación
		
		const finalW = Math.round(origW * mult);
		const finalH = Math.round(origH * mult);
		
		console.log('📏 Escalando canvas directamente:', origW, 'x', origH, '→', finalW, 'x', finalH, `(${mult}x)`);
		
		// Escalar todos los objetos proporcionalmente
		canvas.getObjects().forEach((obj: any) => {
			obj.set({
				left: obj.left * mult,
				top: obj.top * mult,
				scaleX: obj.scaleX * mult,
				scaleY: obj.scaleY * mult
			});
			obj.setCoords();
		});
		
		// Cambiar dimensiones del canvas
		canvas.setWidth(finalW);
		canvas.setHeight(finalH);
		
		console.log('📍 Posiciones de objetos en canvas (DESPUÉS de escalar):');
		canvas.getObjects().forEach((obj: any, idx: number) => {
			console.log(`  Objeto ${idx} (${obj.type}):`, {
				left: obj.left,
				top: obj.top,
				scaleX: obj.scaleX,
				scaleY: obj.scaleY
			});
		});
		
		canvas.renderAll();
		
		console.log('🎨 Canvas renderizado');
		
		// Dar un pequeño delay adicional para asegurar el render
		await new Promise(resolve => setTimeout(resolve, 100));

		console.log('� Exportando canvas escalado sin multiplicador adicional');

		// Exportar SIN multiplier porque el canvas ya está escalado
		let dataUrl: string;
		try {
			// Usar PNG para mantener 100% de calidad sin ninguna pérdida (lossless)
			dataUrl = (canvas as any).toDataURL({ format: 'png' });
			console.log('✅ DataURL generado con éxito (PNG sin pérdida), tamaño:', dataUrl.length);
		} catch (err) {
			console.error('❌ Error generando dataURL:', err);
			throw err;
		}
		const resp = await fetch(dataUrl);
		const blob = await resp.blob();
		console.log('✅ Blob generado:', blob.size, 'bytes', `(${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
		return blob;
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
		const startTime = performance.now();
		console.log('⏱️ INICIO handleSubmit');
		
		setEnviando(true);
		setMensaje("");
		setShowProgress(true);
		setProgress(5);
		try {
			if (!items || items.length === 0) {
				setMensaje("Tu carrito está vacío.");
				setEnviando(false);
				setShowProgress(false);
				return;
			}

			const t1 = performance.now();
			console.log(`⏱️ Validación completada: ${(t1 - startTime).toFixed(0)}ms`);

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

			const t2 = performance.now();
			console.log(`⏱️ Pedido creado (id: ${pedidoId}): ${(t2 - t1).toFixed(0)}ms`);

			setProgress(15);
			setPhase('Creando pedido');


		// 2) Insertar productos primero y obtener productoIds
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
		
		setPhase('Registrando productos');
		const prodInsert = await supabase.from('pedido_productos').insert(productosPayload).select('id');
		if (prodInsert.error) throw prodInsert.error;
		const productoIds: number[] = (prodInsert.data as any[]).map(r => r.id);
		
		const t3 = performance.now();
		console.log(`⏱️ ${productoIds.length} productos registrados: ${(t3 - t2).toFixed(0)}ms`);
		
		setProgress(prev => prev < 45 ? 45 : prev);
			setPhase('Registrando productos');

		// 3) Subir imagen final de cada producto en alta resolución
		const thumbUploadPromises = items.map(async (item, idx) => {
			const itemStartTime = performance.now();
			console.log(`⏱️ 🖼️ Iniciando renderizado item ${idx + 1}/${items.length}`);
			
			const canvasJson = (item as any)?.canvasJson ?? null;
			const tamano = (item.data as any)?.size ?? '90×40 cm';
			let url: string | null = null;
			
			// Obtener los IDs de las imágenes de este item
			const imageIds = ((item.data as any)?.images || [])
				.map((img: any) => img?.id)
				.filter(Boolean) as string[];
			
			if (canvasJson) {
				try {
					const renderStart = performance.now();
					// Generar imagen de alta resolución con las imágenes restauradas desde IndexedDB
					const blob = await renderHighRes(canvasJson, tamano, imageIds);
					const renderEnd = performance.now();
					console.log(`⏱️ 🎨 Render completado item ${idx + 1}: ${(renderEnd - renderStart).toFixed(0)}ms (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
					
					const uploadStart = performance.now();
					const prodId = productoIds[idx];
					const path = `pedidos/${pedidoId}/productos/${prodId}/final.png`;
					const { error: upErr } = await supabase.storage.from('designs').upload(path, blob, { contentType: 'image/png', upsert: true });
					if (upErr) throw upErr;
					const uploadEnd = performance.now();
					console.log(`⏱️ ☁️ Upload completado item ${idx + 1}: ${(uploadEnd - uploadStart).toFixed(0)}ms`);
					
					const { data } = supabase.storage.from('designs').getPublicUrl(path);
					url = data?.publicUrl ?? null;
				} catch (err) {
					console.error('Error generando imagen de alta resolución:', err);
					url = null;
				}
			}
			
			// Actualizar producto con la url y canvas_json (solo en pedido_productos)
			const prodId = productoIds[idx];
			await supabase.from('pedido_productos').update({ url_imagen_final: url, canvas_json: canvasJson }).eq('id', prodId);
			
			const itemEndTime = performance.now();
			console.log(`⏱️ ✅ Item ${idx + 1} completado: ${(itemEndTime - itemStartTime).toFixed(0)}ms TOTAL`);
			return url;
		});

		setPhase('Generando imágenes de alta resolución');
		const t4 = performance.now();
		await Promise.all(thumbUploadPromises);
		const t5 = performance.now();
		console.log(`⏱️ TODAS las imágenes de alta res generadas y subidas: ${(t5 - t4).toFixed(0)}ms`);			// 4) Subir imágenes y recolectar filas en paralelo (con límite de concurrencia)

			const allImageTasks: Array<() => Promise<any | null>> = [];
			items.forEach((it, idx) => {
				const prodId = productoIds[idx];
				const images: Array<{ id?: string; url?: string; props?: any }> = (it as any)?.data?.images || [];
				images.forEach((im, i) => {
					allImageTasks.push(async () => {
						let blob: Blob | null = null;
						if (im.id) {
							try { blob = await getImageBlob(im.id) as Blob; } catch { blob = null; }
						}
						if (!blob && im.url) {
							try {
								const resp = await fetch(im.url);
								if (resp.ok) blob = await resp.blob();
							} catch {}
						}
						let storageUrl: string | null = null;
						if (blob) {
							try {
								const ext = mimeToExt(blob.type);
								const path = `pedidos/${pedidoId}/productos/${prodId}/imagenes/${Date.now()}_${Math.random().toString(36).slice(2)}_${i}.${ext}`;
								const { error: upErr } = await supabase.storage.from('designs').upload(path, blob, { contentType: blob.type || 'image/png', upsert: true });
								if (!upErr) {
									const { data } = supabase.storage.from('designs').getPublicUrl(path);
									storageUrl = data?.publicUrl ?? null;
								}
							} catch {}
						}
						if (!storageUrl && im.url) storageUrl = im.url;
						   if (storageUrl) return { producto_id: prodId, url_storage: storageUrl, props: im.props || null };
						return null;
					});
				});
			});

			const runLimited = async <T,>(tasks: (() => Promise<T>)[], limit = 5): Promise<T[]> => {
				const results: T[] = [];
				let idx = 0;
				async function worker() {
					while (idx < tasks.length) {
						const current = idx++;
						results[current] = await tasks[current]();
					}
				}
				const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
				await Promise.all(workers);
				return results;
			};

			let completedImages = 0;
			const totalImages = allImageTasks.length || 1;
			setPhase('Subiendo imágenes');
			const imageRowsRaw = await runLimited(allImageTasks.map(t => async () => {
				const r = await t();
				completedImages++;
				// Reservar rango 45-75 para imágenes
				setProgress(45 + Math.min(30, Math.round((completedImages / totalImages) * 30)));
				return r;
			}), 4);
			const imageRows = imageRowsRaw.filter(Boolean);
			
			const t6 = performance.now();
			if (imageRows.length) {
				await supabase.from('producto_imagenes').insert(imageRows as any[]);
			}
			
			const t7 = performance.now();
			console.log(`⏱️ Imágenes de usuario subidas: ${(t7 - t6).toFixed(0)}ms (${imageRows.length} imágenes)`);

			setProgress(prev => prev < 75 ? 75 : prev);
			setPhase('Guardando textos');

			// 6) Registrar textos de todos los productos en un solo insert

			const allTextRows: any[] = [];
			items.forEach((it, idx) => {
				const prodId = productoIds[idx];
				const texts: Array<any> = (it as any)?.data?.texts || [];
				   texts.forEach((t: any) => {
					   allTextRows.push({
						   producto_id: prodId, // integer ahora
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
					   });
				   });
			});
			if (allTextRows.length) await supabase.from('producto_textos').insert(allTextRows);
			
			const t8 = performance.now();
			console.log(`⏱️ Textos guardados: ${(t8 - t7).toFixed(0)}ms (${allTextRows.length} textos)`);

			setProgress(prev => prev < 90 ? 90 : prev);
			setPhase('Actualizando pedido');

			// Ya no se espera actualización de pedido, ya se actualizó arriba
			setProgress(100);
			setPhase('Finalizando');


			setMensaje("¡Pedido enviado correctamente!");
			clear();
			
			const endTime = performance.now();
			console.log(`⏱️ ✅ PROCESO COMPLETO: ${(endTime - startTime).toFixed(0)}ms (${((endTime - startTime) / 1000).toFixed(2)}s)`);
			console.log('⏱️ 📊 RESUMEN:');
			console.log(`  - Crear pedido: ${(t2 - t1).toFixed(0)}ms`);
			console.log(`  - Registrar productos: ${(t3 - t2).toFixed(0)}ms`);
			console.log(`  - Generar imágenes alta res: ${(t5 - t4).toFixed(0)}ms`);
			console.log(`  - Subir imágenes usuario: ${(t7 - t6).toFixed(0)}ms`);
			console.log(`  - Guardar textos: ${(t8 - t7).toFixed(0)}ms`);
		} catch (err: any) {
			let msg = "Error al guardar el pedido. Intenta de nuevo.";
			if (err && (err.message || err.details)) {
				msg += `\n${err.message || ''} ${err.details || ''}`;
			}
			setMensaje(msg);
		} finally {
			setEnviando(false);
			// Ocultar barra tras un pequeño delay para que el 100% se vea
			setTimeout(() => setShowProgress(false), 800);
		}
	};

	return (
		<div className="max-w-md mx-auto p-4 relative">
			{showProgress && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Generando pedido">
					<div className="w-full max-w-sm mx-auto px-6 py-6 rounded-xl bg-zinc-900/80 border border-zinc-700 shadow-xl progress-card-anim">
						<h2 className="text-lg font-semibold mb-1 text-center">Generando pedido</h2>
						<p className="text-[11px] text-center text-zinc-400 mb-4">{phase}</p>
						<div className="h-3 w-full bg-zinc-800/60 rounded-full overflow-hidden mb-2 relative" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
							<div className={`h-full transition-all duration-200 ${progress < 18 ? 'progress-indeterminate' : 'progress-shimmer'}`} style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#22d3ee,#a78bfa)' }} />
						</div>
						<div className="flex items-center justify-between text-[10px] text-zinc-500">
							<span>{progress < 100 ? `${progress}%` : 'Completado'}</span>
							<span>{progress < 100 ? phase : 'Listo'}</span>
						</div>
					</div>
				</div>
			)}
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
					{enviando ? (progress < 100 ? `Generando pedido...` : 'Finalizando...') : "Continuar"}
				</button>
				{mensaje && <div className="text-green-600 font-semibold mt-2" role="status" aria-live="polite">{mensaje}</div>}
			</form>
		</div>
	);
};

export default Checkout;
