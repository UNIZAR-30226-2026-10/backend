import Effects from "../services/Effects";
import test, { after, before, describe } from "node:test"
import assert from "node:assert/strict"
import { Tipo_Afeccion, Tipo_Efecto } from "../generated/prisma/enums";
import { cosmeticosPorDefecto } from "./crearDatosBase";

const runId = Date.now()
const testEffectName = `Efecto de prueba ${runId}`

after(async () => {
    await Effects.deleteEffect(testEffectName);
});

before(async () => {
    try {
        await cosmeticosPorDefecto()
    } catch (error) {
        console.error("Error al crear los cosméticos por defecto:", error)
    }
})

describe("Tests de Effects Service", { concurrency: false }, () => {
    test("Añadir un nuevo efecto", async () => {
        const newEffect = await Effects.createEffect({
            nombre: testEffectName,
            descripcion: "Este es un efecto de prueba",
            tipo: Tipo_Efecto.Bufo,
            afecta: Tipo_Afeccion.Jugador
        });
        assert.equal(newEffect.nombre, testEffectName);
    });

    test("Obtener un efecto por nombre", async () => {
        const effect = await Effects.getEffectById(testEffectName);
        assert.equal(effect?.nombre, testEffectName);
    });

    test("Obtener un efecto por nombre que no existe", async () => {
        const effect = await Effects.getEffectById("No existe");
        assert.equal(effect, null);
    });

    test("Eliminar un efecto por nombre", async () => {
        await Effects.createEffect({
            nombre: testEffectName,
            descripcion: "Este es un efecto de prueba",
            tipo: Tipo_Efecto.Bufo,
            afecta: Tipo_Afeccion.Jugador
        });
        const result = await Effects.deleteEffect(testEffectName);
        assert.equal(result.message, "Efecto eliminado correctamente");

        const effect = await Effects.getEffectById(testEffectName);
        assert.equal(effect, null);
    });

    test("Modificar un efecto por nombre", async () => {
        await Effects.createEffect({
            nombre: testEffectName,
            descripcion: "Este es un efecto de prueba",
            tipo: Tipo_Efecto.Bufo,
            afecta: Tipo_Afeccion.Jugador
        });

        const updatedEffect = await Effects.updateEffect(testEffectName, {
            descripcion: "Descripción modificada",
            tipo: Tipo_Efecto.Debufo
        });

        assert.equal(updatedEffect.descripcion, "Descripción modificada");
        assert.equal(updatedEffect.tipo, Tipo_Efecto.Debufo);

        await Effects.deleteEffect(testEffectName);
    });

    test("Modificar un efecto que no existe", async () => {
        const result = await Effects.updateEffect("Efecto inexistente", {
            descripcion: "Descripción modificada"
        });
        assert.equal(result.error, "Error al actualizar el efecto");
    });
})