import { Baraja, BarajaCarta, BarajaPartida, Carta, Partida, Usuario } from "../generated/prisma/client.js";
import prisma from "../prismaClient.js";
import { getCardById } from "./Cards.js";
import { BarajaCartaReturnType, BarajaPartidaReturnType, BarajaReturnType } from "./ReturnTypes.js";

export async function createDeck(data: { nombre: string, usuario: Usuario, carta: Carta[] }): Promise<BarajaReturnType> {
    try {
        const deck = await prisma.baraja.create({
            data: {
                nombre: data.nombre,
                usuario: { connect: { email: data.usuario.email } }
            },
            include: {
                usuario: true,
                barajaCartas: {
                    include: {
                        carta: true
                    }
                },
                usadaEn: true
            }
        });

        if (data.carta.length > 0) {
            try {
                let arrayOfBarajaCarta: BarajaCarta[] = [];
                for (const carta of data.carta) {
                    const barajaCarta = await createBarajaCarta({ baraja: deck, carta });
                    arrayOfBarajaCarta.push(barajaCarta);
                }
                const updatedDeck = await prisma.baraja.update({
                    where: { nombre_usuarioEmail: { nombre: data.nombre, usuarioEmail: data.usuario.email } },
                    data: { barajaCartas: { connect: arrayOfBarajaCarta.map((bc) => ({ Id: bc.Id })) } },
                    include: {
                        usuario: true,
                        barajaCartas: {
                            include: {
                                carta: true
                            }
                        },
                        usadaEn: true
                    }
                });


                return updatedDeck;

            } catch (error) {
                console.error("Error al asociar las cartas a la baraja después de crearla:", error);
                throw new Error("Error al asociar las cartas a la baraja después de crearla");
            }
        }

        return deck;
    } catch (error) {
        console.error("Error al crear la baraja:", error);
        throw new Error("Error al crear la baraja");
    }
}

export async function createDefaultDeckForUser(usuario: Usuario): Promise<BarajaReturnType> {
    try {
        const nombreMazo = "Baraja principante";
        const cartasParaMazo = [
            "Exceso de medios",
            "Salto de longitud",
            "Dia de la marmota",
            "Antidoto",
            "Bolsillo roto",
            "Moises",
            "Robo de identidad",
            "Agujero de serpiente",
            "Coleccionista",
            "Noqueo",
        ];

        const cartasExistentes = [];
        for (const nombreCarta of cartasParaMazo) {
            const carta = await getCardById(nombreCarta);
            if (carta) cartasExistentes.push(carta);
        }

        const mazoPorDefecto = await createDeck({
            nombre: nombreMazo,
            usuario,
            carta: cartasExistentes
        });

        return mazoPorDefecto;

    } catch (error) {
        console.error("Error al crear la baraja por defecto:", error);
        throw new Error("Error al crear la baraja por defecto");
    }
}

export async function createBarajaCarta(data: { baraja: Baraja, carta: Carta }): Promise<BarajaCartaReturnType> {
    try {
        const barajaCarta = await prisma.barajaCarta.create({
            data: {
                barajaUsuarioEmail: data.baraja.usuarioEmail,
                barajaNombre: data.baraja.nombre,
                cartaNombre: data.carta.nombre
            },
            include: {
                carta: true,
                baraja: true
            }
        });
        return barajaCarta;
    } catch (error) {
        console.error("Error al crear la carta en la baraja:", error);
        throw new Error("Error al crear la carta en la baraja");
    }
}

export async function createBarajaPartida(data: { baraja: Baraja, partidaID: string }): Promise<BarajaPartidaReturnType> {
    try {
        const barajaPartida = await prisma.barajaPartida.create({
            data: {
                barajaUsuarioEmail: data.baraja.usuarioEmail,
                barajaNombre: data.baraja.nombre,
                partidaID: data.partidaID
            },
            include: {
                baraja: true,
                partida: true
            }
        });
        return barajaPartida;
    } catch (error) {
        console.error("Error al asociar la baraja con la partida:", error);
        throw new Error("Error al asociar la baraja con la partida");
    }
}

export async function getDeckById(nombre: string, usuarioEmail: string): Promise<BarajaReturnType | null> {
    try {
        const deck = await prisma.baraja.findUnique({
            where: { nombre_usuarioEmail: { nombre, usuarioEmail } },
            include: {
                usuario: true,
                barajaCartas: {
                    include: {
                        carta: true
                    }
                },
                usadaEn: true
            }
        });
        return deck;
    } catch (error) {
        console.error("Error al obtener la baraja por ID:", error);
        throw new Error("Error al obtener la baraja por ID");
    }
}

export async function getAllCardsFromADeck(nombre: string, usuarioEmail: string): Promise<Carta[]> {
    try {
        const barajaCartas = await prisma.barajaCarta.findMany({
            where: { barajaNombre: nombre, barajaUsuarioEmail: usuarioEmail },
            include: {
                carta: true
            }
        });
        return barajaCartas.map((bc: any) => bc.carta);
    } catch (error) {
        console.error("Error al obtener las cartas de la baraja:", error);
        throw new Error("Error al obtener las cartas de la baraja");
    }
}

export async function getAllPartidasFromADeck(nombre: string, usuarioEmail: string): Promise<Partida[]> {
    try {
        const barajaPartidas = await prisma.barajaPartida.findMany({
            where: { barajaNombre: nombre, barajaUsuarioEmail: usuarioEmail },
            include: {
                partida: true
            }
        });
        return barajaPartidas.map(bp => bp.partida);
    } catch (error) {
        console.error("Error al obtener las partidas de la baraja:", error);
        throw new Error("Error al obtener las partidas de la baraja");
    }
}

export async function getAllDecksFromAUser(usuarioEmail: string): Promise<BarajaReturnType[]> {
    try {
        const decks = await prisma.baraja.findMany({
            where: { usuarioEmail },
            include: {
                usuario: true,
                barajaCartas: {
                    include: {
                        carta: true
                    }
                },
                usadaEn: true
            }
        });
        return decks;
    }
    catch (error) {
        console.error("Error al obtener las barajas del usuario:", error);
        throw new Error("Error al obtener las barajas del usuario");
    }
}

export async function getBarajaCartaById(barajaNombre: string, barajaUsuarioEmail: string, cartaNombre: string): Promise<BarajaCartaReturnType[] | null> {
    try {
        const barajaCarta = await prisma.barajaCarta.findMany({
            where: { barajaNombre, barajaUsuarioEmail, cartaNombre },
            include: {
                carta: true,
                baraja: true
            }
        });
        return barajaCarta;
    } catch (error) {
        console.error("Error al obtener la baraja carta por ID:", error);
        throw new Error("Error al obtener la baraja carta por ID");
    }
}

export async function getBarajaPartidaById(barajaNombre: string, barajaUsuarioEmail: string, partidaID: string): Promise<BarajaPartidaReturnType | null> {
    try {
        const barajaPartida = await prisma.barajaPartida.findUnique({
            where: {
                barajaNombre_barajaUsuarioEmail_partidaID: {
                    barajaNombre,
                    barajaUsuarioEmail,
                    partidaID
                }
            },
            include: {
                baraja: true,
                partida: true
            }
        });
        return barajaPartida;
    } catch (error) {
        console.error("Error al obtener la baraja partida por ID:", error);
        throw new Error("Error al obtener la baraja partida por ID");
    }
}

export async function deleteBarajaCarta(barajaNombre: string, barajaUsuarioEmail: string, cartaNombre: string): Promise<{ message: string }> {
    try {
        const barajaCarta = await getBarajaCartaById(barajaNombre, barajaUsuarioEmail, cartaNombre);
        if (!barajaCarta || barajaCarta.length === 0) {
            throw new Error("La carta no se encuentra en la baraja");
        }
        await prisma.barajaCarta.delete({
            where: { Id: barajaCarta[0].Id }
        });
        return { message: "Carta eliminada de la baraja exitosamente" };
    } catch (error) {
        console.error("Error al eliminar la carta de la baraja:", error);
        throw new Error("Error al eliminar la carta de la baraja");
    }
}

export async function deleteBarajaPartida(barajaNombre: string, barajaUsuarioEmail: string, partidaID: string): Promise<{ message: string }> {
    try {
        await prisma.barajaPartida.delete({
            where: {
                barajaNombre_barajaUsuarioEmail_partidaID: {
                    barajaNombre,
                    barajaUsuarioEmail,
                    partidaID
                }
            }
        });
        return { message: "Partida disociada de la baraja exitosamente" };
    } catch (error) {
        console.error("Error al disociar la partida de la baraja:", error);
        throw new Error("Error al disociar la partida de la baraja");
    }
}

export async function updateDeck(nombre: string, usuarioEmail: string, data: { nuevoNombre?: string, cartaAñadir?: Carta[], cartaEliminar?: Carta[], partidasAñadir?: Partida[], partidasEliminar?: Partida[] }): Promise<BarajaReturnType> {
    try {
        return await prisma.$transaction(async (tx) => {
            if (data.cartaEliminar) {
                for (const carta of data.cartaEliminar) {
                    const barajaCartas = await tx.barajaCarta.findMany({
                        where: { barajaNombre: nombre, barajaUsuarioEmail: usuarioEmail, cartaNombre: carta.nombre }
                    });
                    if (barajaCartas.length > 0) {
                        await tx.barajaCarta.delete({ where: { Id: barajaCartas[0].Id } });
                    } else {
                        throw new Error(`La carta ${carta.nombre} no se encuentra en la baraja, no se puede eliminar`);
                    }
                }
            }

            if (data.partidasEliminar) {
                for (const partida of data.partidasEliminar) {
                    const barajaPartida = await tx.barajaPartida.findUnique({
                        where: {
                            barajaNombre_barajaUsuarioEmail_partidaID: { barajaNombre: nombre, barajaUsuarioEmail: usuarioEmail, partidaID: partida.ID }
                        }
                    });
                    if (barajaPartida) {
                        await tx.barajaPartida.delete({
                            where: {
                                barajaNombre_barajaUsuarioEmail_partidaID: { barajaNombre: nombre, barajaUsuarioEmail: usuarioEmail, partidaID: partida.ID }
                            }
                        });
                    } else {
                        throw new Error(`La partida ${partida.ID} no se encuentra asociada a la baraja, no se puede eliminar`);
                    }
                }
            }

            const updatedDeck = await tx.baraja.update({
                where: { nombre_usuarioEmail: { nombre, usuarioEmail } },
                data: {
                    ...(data.nuevoNombre && { nombre: data.nuevoNombre }),
                    barajaCartas: {
                        create: data.cartaAñadir?.map(carta => ({ cartaNombre: carta.nombre })) || []
                    },
                    usadaEn: {
                        create: data.partidasAñadir?.map(partida => ({ partidaID: partida.ID })) || []
                    }
                },
                include: {
                    usuario: true,
                    barajaCartas: {
                        include: {
                            carta: true
                        }
                    },
                    usadaEn: true
                }
            });

            return updatedDeck;
        });
    } catch (error) {
        console.error("Error al actualizar la baraja:", error);
        throw new Error("Error al actualizar la baraja");
    }
}

// Solo podemos eliminar un Deck si no se esta usando activamente en una partida no terminada, si no lanzamos error.
export async function deleteDeck(nombre: string, usuarioEmail: string): Promise<{ message: string }> {

    const deck = await getDeckById(nombre, usuarioEmail);
    if (!deck) {
        throw new Error("Baraja no encontrada");
    }

    const isDeckInUse = await getAllPartidasFromADeck(nombre, usuarioEmail).then(partidas => partidas.some(p => p.estado !== "Finalizada"));

    if (isDeckInUse) {
        throw new Error("No se puede eliminar la baraja porque esta siendo usada en una partida activa");
    }

    try {
        await prisma.baraja.delete({
            where: { nombre_usuarioEmail: { nombre, usuarioEmail } }
        });
        return { message: "Baraja eliminada exitosamente" };
    } catch (error) {
        console.error("Error al eliminar la baraja:", error);
        throw new Error("Error al eliminar la baraja");
    }
}

export async function updateDeckName(nombre: string, usuarioEmail: string, nuevoNombre: string): Promise<BarajaReturnType> {
    try {
        const updatedDeck = await prisma.baraja.update({
            where: { nombre_usuarioEmail: { nombre, usuarioEmail } },
            data: { nombre: nuevoNombre },
            include: {
                usuario: true,
                barajaCartas: {
                    include: {
                        carta: true
                    }
                },
                usadaEn: true
            }
        });
        return updatedDeck;
    } catch (error) {
        console.error("Error al actualizar el nombre de la baraja:", error);
        throw new Error("Error al actualizar el nombre de la baraja");
    }
}

export default {
    createDeck,
    createDefaultDeckForUser,
    createBarajaCarta,
    createBarajaPartida,
    getDeckById,
    getAllCardsFromADeck,
    getAllPartidasFromADeck,
    getAllDecksFromAUser,
    updateDeck,
    deleteDeck,
    updateDeckName
}