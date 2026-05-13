import { Tipo_Cosmetico } from "../generated/prisma/enums.ts";
import { Tipo_Carta, Rareza } from "../generated/prisma/enums.ts";
import { Tipo_Afeccion } from "../generated/prisma/enums.ts";
import { Tipo_Efecto } from "../generated/prisma/enums.ts";
import { Tipo_Logro } from "../generated/prisma/enums.ts";
import { generarTableros } from "./tableros.tsx";

let createCard;
let getCardById;
let getCardByIdBasic;
let createDeck;
let getDeckById;
let updateDeck;
let createCosmetic;
let purchaseCosmetic;
let createUser;
let getUserByEmail;
let modifyUserByEmail;
let updateCosmeticOnUser;
let createEffect;
let createAchievement;
let createBoard;

let servicesLoaded = false;

// Usa código fuente en tests (tsx) y hace fallback a dist para ejecución compilada.
async function loadServices() {
    if (servicesLoaded) return;

    let cards;
    let deck;
    let cosmetics;
    let user;
    let effects;
    let achievements;
    let boards;

    try {
        cards = await import("../services/Cards.ts");
        deck = await import("../services/Deck.ts");
        cosmetics = await import("../services/Cosmetics.ts");
        user = await import("../services/User.ts");
        effects = await import("../services/Effects.ts");
        achievements = await import("../services/Achievements.ts");
        boards = await import("../services/Boards.ts");
    } catch {
        cards = await import("../dist/services/Cards.js");
        deck = await import("../dist/services/Deck.js");
        cosmetics = await import("../dist/services/Cosmetics.js");
        user = await import("../dist/services/User.js");
        effects = await import("../dist/services/Effects.js");
        achievements = await import("../dist/services/Achievements.js");
        boards = await import("../dist/services/Boards.js");
    }

    ({ createCard, getCardById, getCardByIdBasic } = cards);
    ({ createDeck, getDeckById, updateDeck } = deck);
    ({ createCosmetic, purchaseCosmetic } = cosmetics);
    ({ createUser, getUserByEmail, modifyUserByEmail, updateCosmeticOnUser } = user);
    ({ createEffect } = effects);
    ({ createAchievement } = achievements);
    ({ createBoard } = boards);

    servicesLoaded = true;
}

export async function cosmeticosPorDefecto() {
    await loadServices();
    const cosmeticos = [
        {
            nombre: "icono_default",
            tipo: Tipo_Cosmetico.Icono,
            precio: 0,
            descripcion: "Icono por defecto"
        },
        {
            nombre: "ficha_default",
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 0,
            descripcion: "Ficha por defecto"
        },
        {
            nombre: "serpiente_default",
            tipo: Tipo_Cosmetico.Skin_Serpiente,
            precio: 0,
            descripcion: "Serpiente por defecto"
        },
        {
            nombre: "escalera_default",
            tipo: Tipo_Cosmetico.Skin_Escalera,
            precio: 0,
            descripcion: "Escalera por defecto"
        },
        {
            nombre: "icono_nerd",
            tipo: Tipo_Cosmetico.Icono,
            precio: 300,
            descripcion: "Icono con gafas de nerd"
        },
        {
            nombre: "icono_completista",
            tipo: Tipo_Cosmetico.Icono,
            precio: 100,
            descripcion: "Icono con diseño de trofeo de completista"
        },
        {
            nombre: "icono_platino",
            tipo: Tipo_Cosmetico.Icono,
            precio: 2000,
            descripcion: "Icono con diseño de trofeo de platino"
        },
        {
            nombre: "icono_L",
            tipo: Tipo_Cosmetico.Icono,
            precio: 300,
            descripcion: "Icono con diseño de letra L"
        },
        {
            nombre: "icono_W",
            tipo: Tipo_Cosmetico.Icono,
            precio: 400,
            descripcion: "Icono con diseño de letra W"
        },
        {
            nombre: "icono_cofre",
            tipo: Tipo_Cosmetico.Icono,
            precio: 500,
            descripcion: "Icono con diseño de cofre del tesoro"
        },
        {
            nombre: "escalera_estratega",
            tipo: Tipo_Cosmetico.Skin_Escalera,
            precio: 300,
            descripcion: "Escalera con diseño de tablero de ajedrez"
        },
        {
            nombre: "escalera_magnate",
            tipo: Tipo_Cosmetico.Skin_Escalera,
            precio: 400,
            descripcion: "Escalera con diseño de billetes de dinero"
        },
        {
            nombre: "ficha_totem",
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 800,
            descripcion: "Ficha con diseño de tótem"
        },
        {
            nombre: "ficha_aventurero",
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 0,
            descripcion: "Ficha con diseño de sombrero de aventurero"
        },
        {
            nombre: "ficha_esqueleto",
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 900,
            descripcion: "Ficha con diseño de calavera"
        },
        {
            nombre: "ficha_moneda",
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 0,
            descripcion: "Ficha con diseño de moneda"
        },
        {
            nombre: "serpiente_calcetin",
            tipo: Tipo_Cosmetico.Skin_Serpiente,
            precio: 800,
            descripcion: "Serpiente con diseño de calcetín"
        },
        {
            nombre: "serpiente_tribal",
            tipo: Tipo_Cosmetico.Skin_Serpiente,
            precio: 700,
            descripcion: "Serpiente con diseño de patrón tribal"
        },
        {
            nombre: "serpiente_futuro",
            tipo: Tipo_Cosmetico.Skin_Serpiente,
            precio: 900,
            descripcion: "Serpiente con diseño de estilo futurista"
        },
        {
            nombre: "escalera_jungla",
            tipo: Tipo_Cosmetico.Skin_Escalera,
            precio: 600,
            descripcion: "Escalera con diseño de lianas de jungla"
        }
    ];

    for (const cosmetico of cosmeticos) {
        await createCosmetic({
            nombre: cosmetico.nombre,
            tipo: cosmetico.tipo,
            precio: cosmetico.precio,
            descripcion: cosmetico.descripcion
        });
    }
}

export async function cartasPoblación() {
    await loadServices();
    const cartas = [
        {
            nombre: "Exceso de medios",
            tipo: Tipo_Carta.Ofensiva,
            calidad: Rareza.Comun,
            descripcion: "Tiras 2 dados",
        },
        {
            nombre: "Moises",
            tipo: Tipo_Carta.Ofensiva,
            calidad: Rareza.Rara,
            descripcion: "Te saltas un bloqueo",
        },
        {
            nombre: "Wild Frank",
            tipo: Tipo_Carta.Entorno,
            calidad: Rareza.Epica,
            descripcion: "Pones una serpiente donde quieras",
        },
        {
            nombre: "Carpintero",
            tipo: Tipo_Carta.Entorno,
            calidad: Rareza.Legendaria,
            descripcion: "Pones una escalera donde quieras",
        },
        {
            nombre: "Dia de la marmota",
            tipo: Tipo_Carta.Entorno,
            calidad: Rareza.Comun,
            descripcion: "Cambias la casilla para que quien caiga se mueva 4 casillas atrás",
        },
        {
            nombre: "Salto de longitud",
            tipo: Tipo_Carta.Entorno,
            calidad: Rareza.Comun,
            descripcion: "Cambias la casilla para que quien caiga se mueva 4 casillas adelante",
        },
        {
            nombre: "Robo de identidad",
            tipo: Tipo_Carta.Ofensiva,
            calidad: Rareza.Rara,
            descripcion: "Cambias la posicion de una de tus fichas por otra al azar",
        },
        {
            nombre: "Mal de ojo",
            tipo: Tipo_Carta.Ofensiva,
            calidad: Rareza.Epica,
            descripcion: "Le restas a un jugador 3 en su próxima tirada",
        },
        {
            nombre: "Antidoto",
            tipo: Tipo_Carta.Defensiva,
            calidad: Rareza.Comun,
            descripcion: "La próxima serpiente en la que caigas no te hará bajar",
        },
        {
            nombre: "Pickpocket",
            tipo: Tipo_Carta.Ofensiva,
            calidad: Rareza.Rara,
            descripcion: "Robas una carta al azar a otro jugador",
        },
        {
            nombre: "Dado envenenado",
            tipo: Tipo_Carta.Ofensiva,
            calidad: Rareza.Epica,
            descripcion: "El rival solo puede tirar dados de 1-3 en su próximo turno",
        },
        {
            nombre: "Dado dorado",
            tipo: Tipo_Carta.Ofensiva,
            calidad: Rareza.Legendaria,
            descripcion: "Solo podrás sacar entre 4-6 en tu próxima tirada",
        },
        {
            nombre: "Serpiente en tu bota",
            tipo: Tipo_Carta.Entorno,
            calidad: Rareza.Comun,
            descripcion: "Creas una casilla que impide al jugador que caiga en ella tirar dados en su próximo turno",
        },
        {
            nombre: "Parca",
            tipo: Tipo_Carta.Ofensiva,
            calidad: Rareza.Rara,
            descripcion: "Mandas una ficha al azar al inicio del tablero",
        },
        {
            nombre: 'Cambiar de idea',
            tipo: Tipo_Carta.Ofensiva,
            calidad: Rareza.Epica,
            descripcion: 'Descarta todas las cartas de tu mano y roba nuevas hasta llenar tu mano',
        },
        {
            nombre: 'Agujero de serpiente',
            tipo: Tipo_Carta.Entorno,
            calidad: Rareza.Rara,
            descripcion: 'Crea una casilla que te teletransporta a una casilla aleatoria del tablero al caer en ella',
        },
        {
            nombre: "Bolsillo roto",
            tipo: Tipo_Carta.Ofensiva,
            calidad: Rareza.Comun,
            descripcion: "Le quitas todas las cartas a un jugador y solo podrá robar 1 carta",
        },
        {
            nombre: "Compañerismo obligado",
            tipo: Tipo_Carta.Ofensiva,
            calidad: Rareza.Epica,
            descripcion: "Teletransporta a tu ficha más atrás a la posición de una ficha aliada más avanzada",
        },
        {
            nombre: "Coleccionista",
            tipo: Tipo_Carta.Ofensiva,
            calidad: Rareza.Rara,
            descripcion: "Roba dos cartas en tu próximo turno",
        },
        {
            nombre: "Noqueo",
            tipo: Tipo_Carta.Ofensiva,
            calidad: Rareza.Epica,
            descripcion: "Cancela el próximo turno de un rival",
        },

    ];

    for (const carta of cartas) {
        await createCard({
            nombre: carta.nombre,
            descripcion: carta.descripcion,
            tipo: carta.tipo,
            rareza: carta.calidad,
            efecto: []
        });
    }
}
export async function mazosPorDefecto(usuarioEmail = "admin@gmail.com") {
    await loadServices();
    const nombreMazo = "Mazo Básico";
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

    const usuario = await getUserByEmail(usuarioEmail);

    if (!usuario) {
        throw new Error(`No existe el usuario ${usuarioEmail} para crear su mazo por defecto`);
    }

    const cartasExistentes = [];
    for (const nombreCarta of cartasParaMazo) {
        const carta = await getCardById(nombreCarta);
        if (carta) cartasExistentes.push(carta);
    }

    const mazo = await getDeckById(nombreMazo, usuarioEmail);

    if (!mazo) {
        await createDeck({
            nombre: nombreMazo,
            usuario,
            carta: cartasExistentes
        });
        return;
    }

    const cartasYaEnMazo = new Set(mazo.barajaCartas.map((bc) => bc.cartaNombre));
    const cartasAñadir = cartasExistentes.filter((carta) => !cartasYaEnMazo.has(carta.nombre));

    if (cartasAñadir.length > 0) {
        await updateDeck(nombreMazo, usuarioEmail, { cartaAñadir: cartasAñadir });
    }
}

export async function mazoIA(usuarioEmail = "admin@gmail.com") {
    await loadServices();
    const nombreMazo = "Mazo IA";
    const cartasParaMazo = [
        "Exceso de medios",
        "Exceso de medios",
        "Dado dorado",
        "Dado dorado",
        "Mal de ojo",
        "Mal de ojo",
        "Dado envenenado",
        "Dado envenenado",
        "Noqueo",
        "Bolsillo roto",
    ];

    const usuario = await getUserByEmail(usuarioEmail);

    if (!usuario) {
        throw new Error(`No existe el usuario ${usuarioEmail} para crear su mazo de IA`);
    }

    const cartasExistentes = [];
    for (const nombreCarta of cartasParaMazo) {
        const carta = await getCardById(nombreCarta);
        if (carta) cartasExistentes.push(carta);
    }

    const mazo = await getDeckById(nombreMazo, usuarioEmail);

    if (!mazo) {
        await createDeck({
            nombre: nombreMazo,
            usuario,
            carta: cartasExistentes
        });
        return;
    }

    const conteoActual = new Map();
    for (const bc of mazo.barajaCartas) {
        const nombre = bc.cartaNombre;
        conteoActual.set(nombre, (conteoActual.get(nombre) || 0) + 1);
    }

    const faltantes = [];
    for (const carta of cartasExistentes) {
        const actual = conteoActual.get(carta.nombre) || 0;
        if (actual > 0) {
            conteoActual.set(carta.nombre, actual - 1);
            continue;
        }
        faltantes.push(carta);
    }

    if (faltantes.length > 0) {
        await updateDeck(nombreMazo, usuarioEmail, { cartaAñadir: faltantes });
    }
}

export async function cuentaAdminPorDefecto() {
    await loadServices();
    const emailAdmin = "admin@gmail.com";
    await createUser({
        email: emailAdmin,
        nombre: "Admin",
        password: "#Admin123",
    });
    await modifyUserByEmail(emailAdmin, { SEP: 1000000, victorias: 10, derrotas: 10, cartasJugadas: 1000, partidasJugadas: 20 });
    await purchaseCosmetic(emailAdmin, "icono_nerd");
    await purchaseCosmetic(emailAdmin, "icono_completista");
    await purchaseCosmetic(emailAdmin, "icono_platino");
    await purchaseCosmetic(emailAdmin, "icono_L");
    await purchaseCosmetic(emailAdmin, "icono_W");
    await purchaseCosmetic(emailAdmin, "icono_cofre");
    await purchaseCosmetic(emailAdmin, "escalera_estratega");
    await purchaseCosmetic(emailAdmin, "escalera_magnate");
    await purchaseCosmetic(emailAdmin, "ficha_totem");
    await purchaseCosmetic(emailAdmin, "ficha_esqueleto");
    await purchaseCosmetic(emailAdmin, "serpiente_calcetin");
    await purchaseCosmetic(emailAdmin, "serpiente_tribal");
    await purchaseCosmetic(emailAdmin, "serpiente_futuro");
    await purchaseCosmetic(emailAdmin, "escalera_jungla");
    await updateCosmeticOnUser(emailAdmin, "icono_default", { equipado: true });
    await updateCosmeticOnUser(emailAdmin, "ficha_default", { equipado: true });
    await updateCosmeticOnUser(emailAdmin, "serpiente_default", { equipado: true });
    await updateCosmeticOnUser(emailAdmin, "escalera_default", { equipado: true });

    await mazosPorDefecto(emailAdmin);
    await modifyUserByEmail(emailAdmin, { SEP: 10000, victorias: 100, derrotas: 100, cartasJugadas: 500 });
}

export async function efectosPoblacion() {
    await loadServices();
    const efectos = [{
        nombre: "Efecto 1: Tiras 2 dados",
        descripcion: "Tiras 2 dados en tu próximo turno",
        afecta: Tipo_Afeccion.Jugador,
        tipo: Tipo_Efecto.Dados
    },
    {
        nombre: "Efecto 2: Te saltas un bloqueo",
        descripcion: "Te saltas un bloqueo en tu próximo turno",
        afecta: Tipo_Afeccion.Jugador,
        tipo: Tipo_Efecto.Movimiento
    },
    {
        nombre: "Efecto 3: Pones una serpiente donde quieras",
        descripcion: "Pones una serpiente donde quieras en tu próximo turno",
        afecta: Tipo_Afeccion.Casilla,
        tipo: Tipo_Efecto.Debufo
    },
    {
        nombre: "Efecto 4: Pones una escalera donde quieras",
        descripcion: "Pones una escalera donde quieras en tu próximo turno",
        afecta: Tipo_Afeccion.Casilla,
        tipo: Tipo_Efecto.Bufo
    },
    {
        nombre: "Efecto 5: Cambias la casilla para que quien caiga se mueva 4 casillas atrás",
        descripcion: "Cambias la casilla para que quien caiga se mueva 4 casillas atrás",
        afecta: Tipo_Afeccion.Casilla,
        tipo: Tipo_Efecto.Movimiento
    },
    {
        nombre: "Efecto 6: Cambias la casilla para que quien caiga se mueva 4 casillas adelante",
        descripcion: "Cambias la casilla para que quien caiga se mueva 4 casillas adelante",
        afecta: Tipo_Afeccion.Casilla,
        tipo: Tipo_Efecto.Movimiento
    },
    {
        nombre: "Efecto 7: Robas una carta de la pila de descarte",
        descripcion: "Robas una carta de la pila de descarte",
        afecta: Tipo_Afeccion.Jugador,
        tipo: Tipo_Efecto.Debufo
    },
    {
        nombre: "Efecto 8: El rival solo puede tirar dados de 1-3 en su próximo turno",
        descripcion: "El rival solo puede tirar dados de 1-3 en su próximo turno",
        afecta: Tipo_Afeccion.Jugador,
        tipo: Tipo_Efecto.Dados
    },
    {
        nombre: "Efecto 9: Puedes tirar dados de 4-6 en tu próximo turno",
        descripcion: "Puedes tirar dados de 4-6 en tu próximo turno",
        afecta: Tipo_Afeccion.Jugador,
        tipo: Tipo_Efecto.Dados
    },
    {
        nombre: "Efecto 10: Te saltas un bloqueo",
        descripcion: "Te saltas un bloqueo en tu próximo turno",
        afecta: Tipo_Afeccion.Jugador,
        tipo: Tipo_Efecto.Movimiento
    },
    {
        nombre: "Efecto 11: Robas una carta al azar a otro jugador",
        descripcion: "Robas una carta al azar a otro jugador",
        afecta: Tipo_Afeccion.Jugador,
        tipo: Tipo_Efecto.Cartas
    },
    {
        nombre: "Efecto 12: Mandas una ficha al azar al inicio del tablero",
        descripcion: "Mandas una ficha al azar al inicio del tablero",
        afecta: Tipo_Afeccion.Jugador,
        tipo: Tipo_Efecto.Movimiento
    },
    {
        nombre: "Efecto 13: El rival no puede usar cartas en su próximo turno",
        descripcion: "El rival no puede usar cartas en su próximo turno",
        afecta: Tipo_Afeccion.Jugador,
        tipo: Tipo_Efecto.Cartas
    },
    {
        nombre: "Efecto 14: Teletransporta a tu ficha a la posición de la ficha aliada más avanzada",
        descripcion: "Teletransporta a tu ficha a la posición de la ficha aliada más avanzada",
        afecta: Tipo_Afeccion.Jugador,
        tipo: Tipo_Efecto.Movimiento
    },
    {
        nombre: "Efecto 15: Roba dos cartas en tu próximo turno",
        descripcion: "Roba dos cartas en tu próximo turno",
        afecta: Tipo_Afeccion.Jugador,
        tipo: Tipo_Efecto.Cartas
    },
    {
        nombre: "Efecto 16: Cancela el próximo turno de un rival",
        descripcion: "Cancela el próximo turno de un rival",
        afecta: Tipo_Afeccion.Jugador,
        tipo: Tipo_Efecto.Debufo
    }

    ];
    for (const efecto of efectos) {
        await createEffect(efecto);
    }

}

export async function logrosPoblacion() {
    await loadServices();
    const logros = [
        {
            nombre: "Primeros pasos",
            descripcion: "Gana tu primera partida",
            requisito: 1,
            tipo: Tipo_Logro.Victorias,
            cartaID: "Serpiente en tu bota"
        },
        {
            nombre: "En racha",
            descripcion: "Gana 5 partidas",
            requisito: 5,
            tipo: Tipo_Logro.Victorias,
            cartaID: null,
            recompensaMonetaria: 500
        },
        {
            nombre: "Imparable",
            descripcion: "Gana 10 partidas",
            requisito: 10,
            tipo: Tipo_Logro.Victorias,
            cartaID: "Wild Frank"
        },
        {
            nombre: "Manos a la obra",
            descripcion: "Juega tu primera carta",
            requisito: 1,
            tipo: Tipo_Logro.CartasJugadas,
            cartaID: null,
            recompensaMonetaria: 100
        },
        {
            nombre: "Estratega",
            descripcion: "Juega 15 cartas",
            requisito: 15,
            tipo: Tipo_Logro.CartasJugadas,
            cartaID: null,
            recompensaMonetaria: 300
        },
        {
            nombre: "Ahorro inteligente",
            descripcion: "Ahorra 2000 SEP",
            requisito: 2000,
            tipo: Tipo_Logro.SEP,
            cartaID: null,
            recompensaMonetaria: 500
        },
        {
            nombre: "Magnate",
            descripcion: "Ahorra 4000 SEP",
            requisito: 4000,
            tipo: Tipo_Logro.SEP,
            cartaID: null,
            recompensaMonetaria: 2000
        },
        {
            nombre: "Derrotado",
            descripcion: "Pierde tu primera partida",
            requisito: 1,
            tipo: Tipo_Logro.Derrotas,
            cartaID: "Pickpocket"
        },
        {
            nombre: "Resiliente",
            descripcion: "Pierde 5 partidas",
            requisito: 5,
            tipo: Tipo_Logro.Derrotas,
            cartaID: null,
            recompensaMonetaria: 500
        },
        {
            nombre: "Negado",
            descripcion: "Pierde 10 partidas",
            requisito: 10,
            tipo: Tipo_Logro.Derrotas,
            cartaID: "Carpintero"
        },
        {
            nombre: "Coleccionista",
            descripcion: "Obtén todas las cartas",
            requisito: 20,
            tipo: Tipo_Logro.CartasColeccionadas,
            cartaID: null,
            recompensaMonetaria: 1000
        },
        {
            nombre: "Completista",
            descripcion: "Completa 8 logros",
            requisito: 8,
            tipo: Tipo_Logro.LogrosDesbloqueados,
            cartaID: "Mal de ojo"
        },
        {
            nombre: "Platino",
            descripcion: "Completa todos los logros",
            requisito: 12,
            tipo: Tipo_Logro.LogrosDesbloqueados,
            cartaID: null,
            recompensaMonetaria: 5000
        }
    ];
    for (const logro of logros) {
        logro.carta = logro.cartaID ? await getCardByIdBasic(logro.cartaID) : null;
        logro.cartaID = undefined; // Elimina el campo temporal
    }
    for (const logro of logros) {
        await createAchievement(logro);
    }
}

export async function tablerosPoblacion() {
    await loadServices();
    const tablero1 = generarTableros(1);
    const tablero2 = generarTableros(2);
    const tablero3 = generarTableros(3);
    const tableros = [
        {
            boardName: "Basico",
            snapShot: tablero1
        },
        {
            boardName: "Jungla Loca",
            snapShot: tablero2
        },
        {
            boardName: "La apuesta final",
            snapShot: tablero3
        }
    ];
    for (const tablero of tableros) {
        await createBoard(tablero.snapShot, tablero.boardName);
    }
}
