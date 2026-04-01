import Deck from "../services/Deck"
import test, { before, describe } from "node:test"
import assert from "node:assert/strict"
import User from "../services/User"
import Cards from "../services/Cards"
import Effects from "../services/Effects"
import { Tipo_Afeccion,Tipo_Carta,Rareza, Tipo_Efecto } from "../generated/prisma/enums"
import { cosmeticosPorDefecto } from "./CrearDatosBase.js"

const runid = Date.now()

function makeIds(suffix) {
    return {
        email: `prueba_${runid}_${suffix}@gmail.com`,
        deckName: `Mazo de prueba ${runid} ${suffix}`,
        cardName: `Carta de prueba ${runid} ${suffix}`,
        cardWithEffectName: `Carta con efecto ${runid} ${suffix}`,
        effectName: `Efecto de prueba ${runid} ${suffix}`
    };
}

before(async () => {
    try {
        await cosmeticosPorDefecto()
    } catch (error) {
        console.error("Error al crear los cosméticos por defecto:", error)
    }
})

describe("Tests de Deck Service", { concurrency: false }, () => {
    test("Crear un nuevo mazo", async () => {
        const ids = makeIds("crear_mazo");
    const user = await User.createUser({
        email: ids.email,
        password: "prueba123!Secure",
        nombre: "Usuario de prueba"
    });
    assert.ok(user && !user.error);

    const deck = await Deck.createDeck({
        usuario: user,
        nombre: ids.deckName,
        carta: []
    });
    assert.ok(deck && !deck.error);

    await Deck.deleteDeck(deck.nombre, deck.usuarioEmail);
    await User.deleteUserByEmail(user.email);
    });

    test("Crear una carta sin efectos", async () => {
        const ids = makeIds("carta_sin_efecto");
        const card = await Cards.createCard({
            nombre: ids.cardName,
            descripcion: "Esta es una carta de prueba",
            tipo: Tipo_Carta.Ofensiva,
            rareza: Rareza.Comun,
            efecto: []
        });
        assert.ok(card && !card.error);

        await Cards.deleteCard(card.nombre);
    });

    test("Crear una carta con efectos", async () => {
        const ids = makeIds("carta_con_efecto");
        const effect = await Effects.createEffect({
            nombre: ids.effectName,
            descripcion: "Este es un efecto de prueba",
            tipo: Tipo_Efecto.Bufo,
            afecta: Tipo_Afeccion.Jugador
        });
        assert.ok(effect && !effect.error);

        const card = await Cards.createCard({
            nombre: ids.cardWithEffectName,
            descripcion: "Esta carta tiene un efecto",
            tipo: Tipo_Carta.Defensiva,
            rareza: Rareza.Rara,
            efecto: [effect]
        });
        assert.ok(card && !card.error);

        await Effects.deleteEffect(effect.nombre);
        await Cards.deleteCard(card.nombre);
    });

    test("Añadir una carta a un mazo", async () => {
        const ids = makeIds("anadir_carta");
        const user = await User.createUser({
            email: ids.email,
            password: "prueba1234!Secure",
            nombre: "Usuario de prueba"
        });
        assert.ok(user && !user.error);

        const deck = await Deck.createDeck({
            usuario: user,
            nombre: ids.deckName,
            carta: []
        });
        assert.ok(deck && !deck.error);

        const card = await Cards.createCard({
            nombre: ids.cardName,
            descripcion: "Esta es una carta de prueba",
            tipo: Tipo_Carta.Ofensiva,
            rareza: Rareza.Comun,
            efecto: []
        });
        assert.ok(card && !card.error);

        const result = await Deck.updateDeck(deck.nombre, deck.usuarioEmail, {
            cartaAñadir: [card]
        });
        assert.ok(result && !result.error);

        await Deck.deleteDeck(deck.nombre, deck.usuarioEmail);
        await Cards.deleteCard(card.nombre);
        await User.deleteUserByEmail(user.email);
    });

    test("Eliminar una carta de un mazo", async () => {
        const ids = makeIds("eliminar_carta");
        const user = await User.createUser({
            email: ids.email,
            password: "prueba12345!Secure",
            nombre: "Usuario de prueba"
        });
        assert.ok(user && !user.error);

        const deck = await Deck.createDeck({
            usuario: user,
            nombre: ids.deckName,
            carta: []
        });
        assert.ok(deck && !deck.error);

        const card = await Cards.createCard({
            nombre: ids.cardName,
            descripcion: "Esta es una carta de prueba",
            tipo: Tipo_Carta.Ofensiva,
            rareza: Rareza.Comun,
            efecto: []
        });
        assert.ok(card && !card.error);

        const addedDeck = await Deck.updateDeck(deck.nombre, deck.usuarioEmail, {
            cartaAñadir: [card],
        });
        assert.ok(addedDeck && !addedDeck.error);

        const updatedDeck = await Deck.updateDeck(deck.nombre, deck.usuarioEmail, {
            cartaEliminar: [card],
        });
        assert.ok(updatedDeck && !updatedDeck.error);

        await Deck.deleteDeck(deck.nombre, deck.usuarioEmail);
        await Cards.deleteCard(card.nombre);
        await User.deleteUserByEmail(user.email);
    });

    test("Eliminar un mazo", async () => {
        const ids = makeIds("eliminar_mazo");
        const user = await User.createUser({
            email: ids.email,
            password: "prueba123!Secure",
            nombre: "Usuario de prueba"
        });
        assert.ok(user && !user.error);

        const deck = await Deck.createDeck({
            usuario: user,
            nombre: ids.deckName,
            carta: []
        });
        assert.ok(deck && !deck.error);

        const result = await Deck.deleteDeck(deck.nombre, deck.usuarioEmail);
        assert.ok(result && !result.error);

        await User.deleteUserByEmail(user.email);
    });

    test ("Eliminar un mazo que no existe", async () => {
        const ids = makeIds("mazo_inexistente");
        const result = await Deck.deleteDeck(`Mazo inexistente ${runid}`, ids.email);
        assert.ok(result && result.error);
    });

    test("Eliminar una carta que no existe de un mazo", async () => {
        const ids = makeIds("eliminar_carta_no_existe");
        const user = await User.createUser({
            email: ids.email,
            password: "prueba123!Secure",
            nombre: "Usuario de prueba"
        });
        assert.ok(user && !user.error);

        const deck = await Deck.createDeck({
            usuario: user,
            nombre: ids.deckName,
            carta: []
        });
        assert.ok(deck && !deck.error);

        const result = await Deck.updateDeck(deck.nombre, deck.usuarioEmail, {
            cartaEliminar: [{
                nombre: `Carta inexistente ${runid} ${ids.deckName}`,
                descripcion: "No existe",
                tipo: Tipo_Carta.Ofensiva,
                rareza: Rareza.Comun,
                efecto: []
            }]
        });
        assert.ok(result && result.error);

        await Deck.deleteDeck(deck.nombre, deck.usuarioEmail);
        await User.deleteUserByEmail(user.email);
    });

    test("Añadir una carta que no existe a un mazo", async () => {
        const ids = makeIds("anadir_carta_no_existe");
        const user = await User.createUser({
            email: ids.email,
            password: "prueba123!Secure",
            nombre: "Usuario de prueba"
        });
        assert.ok(user && !user.error);

        const deck = await Deck.createDeck({
            usuario: user,
            nombre: ids.deckName,
            carta: []
        });
        assert.ok(deck && !deck.error);

        const result = await Deck.updateDeck(deck.nombre, deck.usuarioEmail, {
            cartaAñadir: [{
                nombre: `Carta inexistente ${runid} ${ids.deckName}`,
                descripcion: "No existe",
                tipo: Tipo_Carta.Ofensiva,
                rareza: Rareza.Comun,
                efecto: []
            }]
        });
        assert.ok(result && result.error);

        await Deck.deleteDeck(deck.nombre, deck.usuarioEmail);
        await User.deleteUserByEmail(user.email);
    });
})
