/**
 * Modelo personal de fatiga: regresión logística entrenada en el propio equipo.
 *
 *   p(fatiga) = σ(b + w · x)      x = [fragmentación, sin pausa, correcciones, ritmo] ∈ [0,1]⁴
 *
 * Cada vez que el usuario dice cómo se siente (1–5), se guarda la pareja
 * (señales del momento, respuesta) y se reentrena con descenso de gradiente
 * sobre la entropía cruzada. Una regularización L2 hacia los pesos iniciales
 * evita que pocas respuestas desvíen el modelo de golpe: con 0 muestras
 * predice igual que la heurística de partida y se va personalizando.
 */

const FEATURES = ['fragmentation', 'noBreak', 'corrections', 'rhythm']

// Pesos de partida: reproducen aproximadamente la heurística original
const PRIOR = { w: [2.6, 2.4, 1.8, 1.4], b: -3 }

const MAX_SAMPLES = 500
const EPOCHS = 1500
const LEARNING_RATE = 1
// La atracción hacia los pesos iniciales se debilita con cada muestra: con pocas respuestas
// el modelo es prudente, con muchas manda lo que el usuario ha dicho
const l2For = (n) => 0.3 / (n + 2)

const sigmoid = (z) => 1 / (1 + Math.exp(-z))
