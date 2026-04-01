import { Prisma } from "../generated/prisma/client.js"

export type BarajaReturnType = Prisma.BarajaGetPayload<{
    include: {
        usuario: true,
        barajaCartas: {
            include: {
                carta: true
            }
        },
        usadaEn: true
    }
}>

export type UsuarioReturnType = Prisma.UsuarioGetPayload<{
    include: {
        amigos: true,
        cartas: true,
        barajas: true,
        logros: true,
        cosmeticos: true,
        partidas: true,
        partidasGanadas: true,
        iconoActual: true,
        fichaActual: true,
        serpienteActual: true,
        escaleraActual: true
    }
}>

export type AuthUserReturnType = Prisma.UsuarioGetPayload<{
    select: {
        email: true,
        nombre: true
    }
}> & { authenticated: boolean }

export type CartaReturnType = Prisma.CartaGetPayload<{
    include: {
        barajas: true,
        efectos: true,
        logros: true
    }
}>

export type EfectoReturnType = Prisma.EfectoGetPayload<{
    include: {
        cartas: true
    }
}>

export type LogrosReturnType = Prisma.LogrosGetPayload<{
    include: {
        usuarios: true,
        carta: true
    }
}>

export type CosmeticosReturnType = Prisma.CosmeticosGetPayload<{
    include: {
        usuarios: true
    }
}>

export type PartidaReturnType = Prisma.PartidaGetPayload<{
    include: {
        partidaJugadores: true,
        barajas: true,
        ganador: true,
        tableroInicial: true
    }
}>

export type TableroInicialReturnType = Prisma.TableroInicialGetPayload<{
    include: {
        partidas: true
    }
}>

export type BarajaCartaReturnType = Prisma.BarajaCartaGetPayload<{
    include: {
        carta: true,
        baraja: true
    }
}>

export type BarajaPartidaReturnType = Prisma.BarajaPartidaGetPayload<{
    include: {
        partida: true,
        baraja: true
    }
}>

export type CosmeticosEquipadosReturnType = Prisma.UsuarioGetPayload<{
    select: {
        fichaActual: true,
        iconoActual: true,
        serpienteActual: true,
        escaleraActual: true
    }
}>

export type CosmeticosDisponiblesUsuarioReturnType = Prisma.UsuarioGetPayload<{
    select: {
        cosmeticos: {
            select: {
                nombre: true
            }
        }
    }
}>
