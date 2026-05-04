
import { Type, Static } from '@sinclair/typebox';


export const EfectoActivoSchema = Type.Object({
    resumenEfecto: Type.String(),
});

export const FichaSchema = Type.Object({
    id: Type.Integer({ minimum: 1, maximum: 3 }),
    casilla: Type.Integer({ minimum: 0, maximum: 100 }),
    meta: Type.Boolean()
});

export const JugadorEstadoSchema = Type.Object({
    username: Type.String(),
    fase: Type.Union([Type.Literal("Cartas"), Type.Literal("Movimiento")]),
    ultimaTirada: Type.Optional(Type.Integer({ minimum: 1, maximum: 6 })),
    fichas: Type.Array(FichaSchema, { minItems: 3, maxItems: 3 }),
    mazo: Type.String(),
    mano: Type.Array(Type.String(), { maxItems: 4 }),
    mazoRestante: Type.Array(Type.String()),
    cementerio: Type.Array(Type.String()),
    cartaJugadaEnTurno: Type.Boolean(),
    cartasJugadas: Type.Integer({ minimum: 0 }),
    efectosActivos: Type.Array(EfectoActivoSchema),
    movimientosPermitidos: Type.Array(Type.Integer())
});

export const SnapshotJugadoresSchema = Type.Object({
    turnoActual: Type.Integer({ minimum: 0 }),
    ronda: Type.Integer({ minimum: 1 }),
    jugadores: Type.Array(JugadorEstadoSchema)
});

export const casillaTableroSchema = Type.Object({
    esCurva: Type.Boolean(),
    rotacion: Type.Number({ minimum: 0 }),
    efecto: Type.Optional(Type.String()),
    tipo: Type.Union([
        Type.Literal("Normal"),
        Type.Literal("Escalera"),
        Type.Literal("Serpiente"),
        Type.Literal("Bifurcacion"),
        Type.Literal("Meta"),
        Type.Literal("Vacía")
    ]),
    siguientes: Type.Array(Type.Integer()),
    saltoA: Type.Optional(Type.Integer()),
});

export const snapshotTableroSchema = Type.Object({
    casillas: Type.Array(casillaTableroSchema)
})

export const chatPartidaSchema = Type.Array(Type.Object({
    mandadoPor: Type.String(),
    mensaje: Type.String(),
}))


export type SnapshotJugadoresJSON = Static<typeof SnapshotJugadoresSchema>;
export type SnapshotTableroJSON = Static<typeof snapshotTableroSchema>;
export type ChatPartidaJSON = Static<typeof chatPartidaSchema>;