import Deck from "../services/Deck"
import test, { before, describe } from "node:test"
import assert from "node:assert/strict"
import User from "../services/User"
import Cards from "../services/Cards"
import Effects from "../services/Effects"
import { Tipo_Afeccion, Tipo_Carta, Rareza, Tipo_Efecto } from "../generated/prisma/enums"
import { cosmeticosPorDefecto } from "./CrearDatosBase.js"

const runid = Date.now()

function makeIds(suffix) {
    return {
        email: `prueba_${runid}_${suffix}@gmail.com`,
        deckName: `Mazo de prueba ${runid} ${suffix}`,
        cardName: `Carta de prueba ${runid} ${suffix}`,
        cardWithEffectName: `Carta con efecto ${runid} ${suffix}`,
        effectName: `Efecto de prueba ${runid} ${suffix}`
    }
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
        const ids = makeIds("crear_mazo")
        const user = await User.createUser({
            email: ids.email,
            password: "prueba123!Secure",
            nombre: "Usuario de prueba"
        })
        assert.ok(user)

        const deck = await Deck.createDeck({
            usuario: user,
            nombre: ids.deckName,
            carta: []
        })
        assert.ok(deck)

        await Deck.deleteDeck(deck.nombre, deck.usuarioEmail)
        await User.deleteUserByEmail(user.email)
    })

    test("Crear una carta sin efectos", async () => {
        const ids = makeIds("carta_sin_efecto")
        const card = await Cards.createCard({
            nombre: ids.cardName,
            descripcion: "Esta es una carta de prueba",
            tipo: Tipo_Carta.Ofensiva,
            rareza: Rareza.Comun,
            efecto: []
        })
        assert.ok(card)

        await Cards.deleteCard(card.nombre)
    })

    test("Crear una carta con efectos", async () => {
        const ids = makeIds("carta_con_efecto")
        const effect = await Effects.createEffect({
            nombre: ids.effectName,
            descripcion: "Este es un efecto de prueba",
            tipo: Tipo_Efecto.Bufo,
            afecta: Tipo_Afeccion.Jugador
        })
        assert.ok(effect)

        const card = await Cards.createCard({
            nombre: ids.cardWithEffectName,
            descripcion: "Esta carta tiene un efecto",
            tipo: Tipo_Carta.Defensiva,
            rareza: Rareza.Rara,
            efecto: [effect]
        })
        assert.ok(card)

        await Effects.deleteEffect(effect.nombre)
        await Cards.deleteCard(card.nombre)
    })

    test("Añadir una carta a un mazo", async () => {
        const ids = makeIds("anadir_carta")
        const user = await User.createUser({
            email: ids.email,
            password: "prueba1234!Secure",
            nombre: "Usuario de prueba"
        })
        assert.ok(user)

        const deck = await Deck.createDeck({
            usuario: user,
            nombre: ids.deckName,
            carta: []
        })
        assert.ok(deck)

        const card = await Cards.createCard({
            nombre: ids.cardName,
            descripcion: "Esta es una carta de prueba",
            tipo: Tipo_Carta.Ofensiva,
            rareza: Rareza.Comun,
            efecto: []
        })
        assert.ok(card)

        const result = await Deck.updateDeck(deck.nombre, deck.usuarioEmail, {
            cartaAñadir: [card]
        })
        assert.ok(result)

        await Deck.deleteDeck(deck.nombre, deck.usuarioEmail)
        await Cards.deleteCard(card.nombre)
        await User.deleteUserByEmail(user.email)
    })

    test("Eliminar una carta de un mazo", async () => {
        const ids = makeIds("eliminar_carta")
        const user = await User.createUser({
            email: ids.email,
            password: "prueba12345!Secure",
            nombre: "Usuario de prueba"
        })
        assert.ok(user)

        const deck = await Deck.createDeck({
            usuario: user,
            nombre: ids.deckName,
            carta: []
        })
        assert.ok(deck)

        const card = await Cards.createCard({
            nombre: ids.cardName,
            descripcion: "Esta es una carta de prueba",
            tipo: Tipo_Carta.Ofensiva,
            rareza: Rareza.Comun,
            efecto: []
        })
        assert.ok(card)

        const addedDeck = await Deck.updateDeck(deck.nombre, deck.usuarioEmail, {
            cartaAñadir: [card],
        })
        assert.ok(addedDeck)

        const updatedDeck = await Deck.updateDeck(deck.nombre, deck.usuarioEmail, {
            cartaEliminar: [card],
        })
        assert.ok(updatedDeck)

        await Deck.deleteDeck(deck.nombre, deck.usuarioEmail)
        await Cards.deleteCard(card.nombre)
        await User.deleteUserByEmail(user.email)
    })

    test("Eliminar un mazo", async () => {
        const ids = makeIds("eliminar_mazo")
        const user = await User.createUser({
            email: ids.email,
            password: "prueba123!Secure",
            nombre: "Usuario de prueba"
        })
        assert.ok(user)

        const deck = await Deck.createDeck({
            usuario: user,
            nombre: ids.deckName,
            carta: []
        })
        assert.ok(deck)

        const result = await Deck.deleteDeck(deck.nombre, deck.usuarioEmail)
        assert.equal(result.message, "Baraja eliminada exitosamente")

        await User.deleteUserByEmail(user.email)
    })

    test("Eliminar un mazo que no existe", async () => {
        const ids = makeIds("mazo_inexistente")
        await assert.rejects(
            Deck.deleteDeck(`Mazo inexistente ${runid}`, ids.email),
            /Baraja no encontrada/
        )
    })

    test("Eliminar una carta que no existe de un mazo", async () => {
        const ids = makeIds("eliminar_carta_no_existe")
        const user = await User.createUser({
            email: ids.email,
            password: "prueba123!Secure",
            nombre: "Usuario de prueba"
        })
        assert.ok(user)

        const deck = await Deck.createDeck({
            usuario: user,
            nombre: ids.deckName,
            carta: []
        })
        assert.ok(deck)

        await assert.rejects(
            Deck.updateDeck(deck.nombre, deck.usuarioEmail, {
                cartaEliminar: [{
                    nombre: `Carta inexistente ${runid} ${ids.deckName}`,
                    descripcion: "No existe",
                    tipo: Tipo_Carta.Ofensiva,
                    rareza: Rareza.Comun,
                    efecto: []
                }]
            }),
            /Error al actualizar la baraja|no se encuentra en la baraja/
        )

        await Deck.deleteDeck(deck.nombre, deck.usuarioEmail)
        await User.deleteUserByEmail(user.email)
    })

    test("Añadir una carta que no existe a un mazo", async () => {
        const ids = makeIds("anadir_carta_no_existe")
        const user = await User.createUser({
            email: ids.email,
            password: "prueba123!Secure",
            nombre: "Usuario de prueba"
        })
        assert.ok(user)

        const deck = await Deck.createDeck({
            usuario: user,
            nombre: ids.deckName,
            carta: []
        })
        assert.ok(deck)

        await assert.rejects(
            Deck.updateDeck(deck.nombre, deck.usuarioEmail, {
                cartaAñadir: [{
                    nombre: `Carta inexistente ${runid} ${ids.deckName}`,
                    descripcion: "No existe",
                    tipo: Tipo_Carta.Ofensiva,
                    rareza: Rareza.Comun,
                    efecto: []
                }]
            }),
            /Error al actualizar la baraja/
        )

        await Deck.deleteDeck(deck.nombre, deck.usuarioEmail)
        await User.deleteUserByEmail(user.email)
    })
})
