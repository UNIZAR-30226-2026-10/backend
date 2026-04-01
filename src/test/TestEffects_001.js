import Effects from "../services/Effects";
import test, { before, describe } from "node:test"
import assert from "node:assert/strict"
import { Tipo_Afeccion, Tipo_Efecto } from "../generated/prisma/enums";
import { cosmeticosPorDefecto } from "./CrearDatosBase.js";

const runId = Date.now()
const effectName = (suffix) => `Efecto de prueba ${runId} ${suffix}`

before(async () => {
    try {
        await cosmeticosPorDefecto()
    } catch (error) {
        console.error("Error al crear los cosméticos por defecto:", error)
    }
})

describe("Tests de Effects Service", { concurrency: false }, () => {
    test("Añadir un nuevo efecto", async () => {
        const nombre = effectName("crear")
        const newEffect = await Effects.createEffect({
            nombre,
            descripcion: "Este es un efecto de prueba",
            tipo: Tipo_Efecto.Bufo,
            afecta: Tipo_Afeccion.Jugador
        });
        assert.equal(newEffect.nombre, nombre);

        await Effects.deleteEffect(nombre)
    });

    test("Obtener un efecto por nombre", async () => {
        const nombre = effectName("obtener")
        await Effects.createEffect({
            nombre,
            descripcion: "Este es un efecto de prueba",
            tipo: Tipo_Efecto.Bufo,
            afecta: Tipo_Afeccion.Jugador
        });

        const effect = await Effects.getEffectById(nombre);
        assert.equal(effect?.nombre, nombre);

        await Effects.deleteEffect(nombre)
    });

    test("Obtener un efecto por nombre que no existe", async () => {
        const effect = await Effects.getEffectById(effectName("no-existe"));
        assert.equal(effect, null);
    });

    test("Eliminar un efecto por nombre", async () => {
        const nombre = effectName("eliminar")
        await Effects.createEffect({
            nombre,
            descripcion: "Este es un efecto de prueba",
            tipo: Tipo_Efecto.Bufo,
            afecta: Tipo_Afeccion.Jugador
        });
        const result = await Effects.deleteEffect(nombre);
        assert.equal(result.message, "Efecto eliminado correctamente");

        const effect = await Effects.getEffectById(nombre);
        assert.equal(effect, null);
    });

    test("Modificar un efecto por nombre", async () => {
        const nombre = effectName("modificar")
        await Effects.createEffect({
            nombre,
            descripcion: "Este es un efecto de prueba",
            tipo: Tipo_Efecto.Bufo,
            afecta: Tipo_Afeccion.Jugador
        });

        const updatedEffect = await Effects.updateEffect(nombre, {
            descripcion: "Descripción modificada",
            tipo: Tipo_Efecto.Debufo
        });

        assert.equal(updatedEffect.descripcion, "Descripción modificada");
        assert.equal(updatedEffect.tipo, Tipo_Efecto.Debufo);

        await Effects.deleteEffect(nombre);
    });

    test("Modificar un efecto que no existe", async () => {
        await assert.rejects(
            Effects.updateEffect(effectName("inexistente"), {
                descripcion: "Descripción modificada"
            }),
            /Error al actualizar el efecto/
        )
    });
})
