import { Baraja, BarajaCarta, BarajaPartida, Carta, Partida, Usuario } from "../generated/prisma/client.js";
import prisma from "../prismaClient.js";
import { BarajaCartaReturnType, BarajaPartidaReturnType, BarajaReturnType } from "./ReturnTypes.js";

export async function createDeck(data: { nombre: string, usuario: Usuario, carta: Carta[] }): Promise<BarajaReturnType> {
    try {
        const deck = await prisma.baraja.create({
            data : {
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
            let arrayOfBarajaCarta: BarajaCarta[] = [];
            for (const carta of data.carta) {
                const barajaCarta = await createBarajaCarta({ baraja: deck, carta });
                arrayOfBarajaCarta.push(barajaCarta);
            }
            const updatedDeck = await prisma.baraja.update({
                where: { nombre_usuarioEmail: { nombre: data.nombre, usuarioEmail: data.usuario.email } },
                data: { barajaCartas: { connect: arrayOfBarajaCarta.map((bc) => ({ barajaNombre_barajaUsuarioEmail_cartaNombre: {
                    barajaNombre: data.nombre,
                    barajaUsuarioEmail: data.usuario.email,
                    cartaNombre: bc.cartaNombre
                } })) } },
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
        }
        

        return deck;
    } catch (error) {
        console.error("Error al crear la baraja:", error);
        throw new Error("Error al crear la baraja");
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
        return barajaCartas.map(bc => bc.carta);
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

export async function getBarajaCartaById(barajaNombre: string, barajaUsuarioEmail: string, cartaNombre: string): Promise<BarajaCartaReturnType | null> {
    try {
        const barajaCarta = await prisma.barajaCarta.findUnique({
            where: { barajaNombre_barajaUsuarioEmail_cartaNombre: {
                barajaNombre,
                barajaUsuarioEmail,
                cartaNombre
            } },
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
            where: { barajaNombre_barajaUsuarioEmail_partidaID: {
                barajaNombre,
                barajaUsuarioEmail,
                partidaID
            } },
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
        await prisma.barajaCarta.delete({
            where: { barajaNombre_barajaUsuarioEmail_cartaNombre: {
                barajaNombre,
                barajaUsuarioEmail,
                cartaNombre
            } }
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
            where: { barajaNombre_barajaUsuarioEmail_partidaID: {
                barajaNombre,
                barajaUsuarioEmail,
                partidaID
            } }
        });
        return { message: "Partida disociada de la baraja exitosamente" };
    } catch (error) {
        console.error("Error al disociar la partida de la baraja:", error);
        throw new Error("Error al disociar la partida de la baraja");
    }
}

export async function updateDeck(nombre: string, usuarioEmail: string, data: { cartaAñadir?: Carta[], cartaEliminar?: Carta[], partidasAñadir?: Partida[], partidasEliminar?: Partida[] }): Promise<BarajaReturnType> {
    try {
        let arrayOfBarajaCartaAñadir: BarajaCarta[] = [];
        let arrayOfBarajaPartidaAñadir: BarajaPartida[] = [];
        let arrayOfBarajaCartaEliminar: BarajaCarta[] = [];
        let arrayOfBarajaPartidaEliminar: BarajaPartida[] = [];
        if(data.cartaAñadir) {
            for (const carta of data.cartaAñadir) {
                const barajaCarta = await createBarajaCarta({ baraja: { nombre, usuarioEmail } as Baraja, carta });
                arrayOfBarajaCartaAñadir.push(barajaCarta);
            }
        }

        if(data.partidasAñadir) {
            for (const partida of data.partidasAñadir) {
                const barajaPartida = await createBarajaPartida({ baraja: { nombre, usuarioEmail } as Baraja, partidaID: partida.ID });
                arrayOfBarajaPartidaAñadir.push(barajaPartida);
            }
        }

        if(data.cartaEliminar) {
            for (const carta of data.cartaEliminar) {
                const barajaCarta = await getBarajaCartaById(nombre, usuarioEmail, carta.nombre);
                if(barajaCarta) {
                    arrayOfBarajaCartaEliminar.push(barajaCarta);
                    await deleteBarajaCarta(nombre, usuarioEmail, carta.nombre);
                } else {
                    console.warn(`La carta ${carta.nombre} no se encuentra en la baraja, no se puede eliminar`);
                    throw new Error(`La carta ${carta.nombre} no se encuentra en la baraja, no se puede eliminar`);
                }
            }
        }

        if(data.partidasEliminar) {
            for (const partida of data.partidasEliminar) {
                const barajaPartida = await getBarajaPartidaById(nombre, usuarioEmail, partida.ID);
                if(barajaPartida) {
                    arrayOfBarajaPartidaEliminar.push(barajaPartida);
                    await deleteBarajaPartida(nombre, usuarioEmail, partida.ID);
                } else {
                    console.warn(`La partida ${partida.ID} no se encuentra asociada a la baraja, no se puede eliminar`);
                    throw new Error(`La partida ${partida.ID} no se encuentra asociada a la baraja, no se puede eliminar`);
                }
            }
        }

        const updatedDeck = await prisma.baraja.update({
            where: { nombre_usuarioEmail: { nombre, usuarioEmail } },
            data: { barajaCartas: { connect: arrayOfBarajaCartaAñadir.map((bc) => ({ barajaNombre_barajaUsuarioEmail_cartaNombre: {
                barajaNombre: nombre,
                barajaUsuarioEmail: usuarioEmail,
                cartaNombre: bc.cartaNombre
            } })) },
                usadaEn: { connect: arrayOfBarajaPartidaAñadir.map((bp) => ({ barajaNombre_barajaUsuarioEmail_partidaID: {
                    barajaNombre: nombre,
                    barajaUsuarioEmail: usuarioEmail,
                    partidaID: bp.partidaID
                } })) }
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

export default {
    createDeck,
    createBarajaCarta,
    createBarajaPartida,
    getDeckById,
    getAllCardsFromADeck,
    getAllPartidasFromADeck,
    getAllDecksFromAUser,
    updateDeck,
    deleteDeck
}