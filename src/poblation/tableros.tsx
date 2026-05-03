import type { SnapshotTableroJSON } from "../services/JsonTypes.js";

type CasillaTablero = SnapshotTableroJSON["casillas"][number];

export interface SnapshotTablero {
    casillas: (CasillaTablero | undefined)[];
}
// Clona el snapshot para evitar mutaciones accidentales entre componentes.
export function generarTableros(tipo: number): SnapshotTablero {
    
    const sparseCasillasArray = new Array(100);
    switch (tipo) {
        case 1:
            for (let numeroCasilla = 1; numeroCasilla < 45; numeroCasilla++) {
                const indice = numeroCasilla - 1;
                const fila = Math.floor((numeroCasilla - 1) / 10);
                const enBordeDerecho = numeroCasilla % 10 === 0;
                const enBordeIzquierdo = numeroCasilla % 10 === 1;
                const filaPar = fila % 2 === 0;
                const ultimaFilaCamino = Math.floor((45 - 1) / 10);

                const inicioFila = filaPar ? fila * 10 + 1 : fila * 10 + 10;
                const finFila = filaPar ? fila * 10 + 10 : fila * 10 + 1;

                const esCurvaSubida = numeroCasilla === finFila && fila < ultimaFilaCamino;
                const esCurvaBajada = numeroCasilla === inicioFila && fila > 0;

                const esCurvaBorde = esCurvaSubida || esCurvaBajada;

                let rotacion = 90;
                if (esCurvaSubida) {
                    rotacion = enBordeDerecho ? 180 : 270;
                } else if (esCurvaBajada) {
                    rotacion = enBordeDerecho ? 90 : 0;
                }

                let siguiente: number | undefined;
                if (numeroCasilla < 45 ) {
                    if (filaPar) {
                        siguiente = enBordeDerecho ? numeroCasilla + 10 : numeroCasilla + 1;
                    } else {
                        siguiente = enBordeIzquierdo ? numeroCasilla + 10 : numeroCasilla - 1;
                    }
                }

                sparseCasillasArray[indice] = {
                    esCurva: esCurvaBorde,
                    rotacion,
                    tipo: "Normal",
                    siguientes: siguiente !== undefined ? [siguiente-1] : []
                };
            } 
            sparseCasillasArray[44] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [45] };
            sparseCasillasArray[45] = { esCurva: true, rotacion: 180, tipo: "Normal", siguientes: [55] };
            for (let i = 51; i <= 90; i++) {
                const modulo = i % 10;
                const fila = Math.floor((i - 1) / 10);
                const esFilaInferior = (fila % 2) == 1;
                const filaPar = fila % 2 === 0;
                if(modulo==5){
                    sparseCasillasArray[i - 1] = {
                        esCurva: true,
                        rotacion: esFilaInferior ? 0 : 270,
                        tipo: "Normal",
                        siguientes: esFilaInferior ? [i ] : [i + 9]
                    };
                }
                if(modulo < 5 && modulo > 1){
                    sparseCasillasArray[i - 1] = {
                        esCurva: false,
                        rotacion: 90,
                        tipo: "Normal",
                        siguientes: filaPar ? [i] : [i - 2]
                    };
                }
                if (modulo > 5 && modulo <= 9){
                    sparseCasillasArray[i - 1] = {
                        esCurva: false,
                        rotacion: 90,
                        tipo: "Normal",
                        siguientes: filaPar ? [i - 2] : [i ]
                    };
                }
                if(modulo ==0){
                    sparseCasillasArray[i - 1] = {
                        esCurva: true,
                        rotacion: esFilaInferior ? 180 : 90,
                        tipo: "Curva",
                        siguientes: esFilaInferior ? [i + 9] : [i - 2]
                    };
                }
                if(modulo ==1){
                    sparseCasillasArray[i - 1] = {
                        esCurva: true,
                        rotacion: esFilaInferior ? 270 : 0,
                        tipo: "Curva",
                        siguientes: esFilaInferior ? [i + 9] : [i ]
                    };
                }
                if(modulo ==4){
                    sparseCasillasArray[i - 1] = {
                        esCurva: true,
                        rotacion: esFilaInferior ? 90 : 180,
                        tipo: "Curva",
                        siguientes: esFilaInferior ? [i - 2] : [i + 9]
                    };
                }
            }
            sparseCasillasArray[53] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [52] };
            sparseCasillasArray[54] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [53] };
            sparseCasillasArray[55] = { esCurva: false, rotacion: 270, tipo: "Bifurcacion", siguientes: [56, 54] };
            sparseCasillasArray[93] = { esCurva: true, rotacion: 0, tipo: "Curva", siguientes: [94] };
            for(let i = 96; i < 100; i++) {
                sparseCasillasArray[i - 1] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [i] };
            }
            sparseCasillasArray[94] = { esCurva: false, rotacion: 270, tipo: "Bifurcacion", siguientes: [95] };
            sparseCasillasArray[99] = { esCurva: false, rotacion: 270, tipo: "Meta", siguientes: [] };

            //serpientes
            sparseCasillasArray[16] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [15], saltoA: 8 };
            sparseCasillasArray[53] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [52], saltoA: 42 };
            sparseCasillasArray[67] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [66], saltoA: 18 };
            sparseCasillasArray[82] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [81], saltoA: 55 };
            sparseCasillasArray[98] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [99], saltoA: 24 };
            //escaleras
            sparseCasillasArray[6] = { esCurva: false, rotacion: 90, tipo: "Escalera", siguientes: [7], saltoA: 25 };
            sparseCasillasArray[14] = { esCurva: false, rotacion: 90, tipo: "Escalera", siguientes: [13], saltoA: 30 };
            sparseCasillasArray[50] = { esCurva: true, rotacion: 270, tipo: "Escalera", siguientes: [60], saltoA: 72 };
            sparseCasillasArray[36] = { esCurva: false, rotacion: 90, tipo: "Escalera", siguientes: [35], saltoA: 97 };
            sparseCasillasArray[64] = { esCurva: true, rotacion: 270, tipo: "Escalera", siguientes: [74], saltoA: 83 };
            for(let i = 1; i <= 100; i++) {
                if(!sparseCasillasArray[i]) {
                    sparseCasillasArray[i] = { esCurva: false, rotacion: 90, tipo: "Vacía", siguientes: [] };
                }
            }
            return {
                casillas: sparseCasillasArray,
            };
            break;
        case 2:
            for(let numeroCasilla = 1; numeroCasilla <= 5; numeroCasilla++) {
                const indice = numeroCasilla - 1;
                let rotacion = 90;

                let siguiente: number | undefined;
                siguiente = numeroCasilla + 1;


                sparseCasillasArray[indice] = {
                    esCurva: false,
                    rotacion,
                    tipo: "Normal",
                    siguientes: siguiente !== undefined ? [siguiente-1] : []
                };
            }
            sparseCasillasArray[5]= { esCurva: true, rotacion: 180, tipo: "Curva", siguientes: [15] };
            sparseCasillasArray[15]= { esCurva: false, rotacion: 270, tipo: "Bifurcacion", siguientes: [14,16] };
            for(let i = 17 ;i <=19;i++){
                sparseCasillasArray[i - 1] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [i] };
            }
            sparseCasillasArray[19] = { esCurva: true, rotacion: 180, tipo: "Curva", siguientes: [29] };
            sparseCasillasArray[29] = { esCurva: false, rotacion: 360, tipo: "Bifurcacion", siguientes: [28,39] };
            sparseCasillasArray[39] = { esCurva: true, rotacion: 90, tipo: "Curva", siguientes: [38] };
            for(let i = 12; i <= 15; i++){
                sparseCasillasArray[i - 1] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [i-2] };
            }
            for(let i = 39; i >= 37; i--){
                sparseCasillasArray[i - 1] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [i-2] };
            }
            for(let i = 29; i >= 25; i--){
                sparseCasillasArray[i - 1] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [i-2] };
            }
            sparseCasillasArray[24] = { esCurva: true, rotacion: 270, tipo: "Curva", siguientes: [34] };
            sparseCasillasArray[35] = { esCurva: true, rotacion: 270, tipo: "Curva", siguientes: [45] };
            sparseCasillasArray[34] = { esCurva: false, rotacion: 360, tipo: "Bifurcacion", siguientes: [44] };   
            sparseCasillasArray[10] = { esCurva: true, rotacion: 270, tipo: "Curva", siguientes: [20] };
            sparseCasillasArray[20] = { esCurva: true, rotacion: 360, tipo: "Curva", siguientes: [21] };
            sparseCasillasArray[21] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [22] };
            sparseCasillasArray[22] = { esCurva: true, rotacion: 180, tipo: "Curva", siguientes: [32] };
            sparseCasillasArray[33] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [34] };
            sparseCasillasArray[32] = { esCurva: true, rotacion: 270, tipo: "Bifurcacion", siguientes: [31,33] };
            sparseCasillasArray[31] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [30] };
            sparseCasillasArray[30] = { esCurva: true , rotacion: 270, tipo: "Curva", siguientes: [40] };
            sparseCasillasArray[40] = { esCurva: true, rotacion: 360, tipo: "Curva", siguientes: [41] };
            sparseCasillasArray[41] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [42] };
            sparseCasillasArray[42] = { esCurva: true, rotacion: 180, tipo: "Curva", siguientes: [52] };
            sparseCasillasArray[43] = { esCurva: true, rotacion: 270, tipo: "Curva", siguientes: [53] };
            sparseCasillasArray[44] = { esCurva: true, rotacion: 90, tipo: "Curva", siguientes: [43] };
            sparseCasillasArray[45] = { esCurva: true, rotacion: 360, tipo: "Curva", siguientes: [46] };
            sparseCasillasArray[46] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [47] };
            sparseCasillasArray[47] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [48] };
            sparseCasillasArray[48] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [49] };
            sparseCasillasArray[49] = { esCurva: true, rotacion: 180, tipo: "Curva", siguientes: [59] };
            sparseCasillasArray[50] = { esCurva: true, rotacion: 270, tipo: "Curva", siguientes: [60] };
            sparseCasillasArray[51] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [50] };
            sparseCasillasArray[52] = { esCurva: true, rotacion: 90, tipo: "Curva", siguientes: [51] };
            sparseCasillasArray[53] = { esCurva: true, rotacion: 360, tipo: "Normal", siguientes: [54]};
            sparseCasillasArray[54] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [55] };
            sparseCasillasArray[55] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [56] };
            sparseCasillasArray[56] = { esCurva: true, rotacion: 180, tipo: "Curva", siguientes: [66] };
            sparseCasillasArray[57] = { esCurva: true, rotacion: 270, tipo: "Curva", siguientes: [67] };
            sparseCasillasArray[58] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [57] }; 
            sparseCasillasArray[59] = { esCurva: true, rotacion: 90, tipo: "Curva", siguientes: [58] };
            sparseCasillasArray[60] = { esCurva: true, rotacion: 360, tipo: "Curva", siguientes: [61] };
            sparseCasillasArray[61] = { esCurva: false, rotacion: 270, tipo: "Normal", siguientes: [62] };
            sparseCasillasArray[62] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [63] };
            sparseCasillasArray[63] = { esCurva: true, rotacion: 180, tipo: "Curva", siguientes: [73] }; 
            sparseCasillasArray[64] = { esCurva: true, rotacion: 270, tipo: "Curva", siguientes: [74]}; 
            sparseCasillasArray[65] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [64] };
            sparseCasillasArray[66] = { esCurva: true, rotacion: 90, tipo: "Curva", siguientes: [65] };
            sparseCasillasArray[67] = { esCurva: true, rotacion: 360, tipo: "Curva", siguientes: [68] };
            sparseCasillasArray[68] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [69] };
            sparseCasillasArray[69] = { esCurva: true, rotacion: 180, tipo: "Curva", siguientes: [79] };
            sparseCasillasArray[73] = { esCurva: false, rotacion: 180, tipo: "Bifurcacion", siguientes: [83] };
            sparseCasillasArray[74] = { esCurva: true, rotacion: 90, tipo: "Curva", siguientes: [73] };
            sparseCasillasArray[75] = { esCurva: true, rotacion: 270, tipo: "Curva", siguientes: [85] };
            sparseCasillasArray[76] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [75] };
            sparseCasillasArray[77] = { esCurva: true, rotacion: 180, tipo: "Curva", siguientes: [76] };
            sparseCasillasArray[78] = { esCurva: true, rotacion: 270, tipo: "Curva", siguientes: [88] };
            sparseCasillasArray[79] = { esCurva: true, rotacion: 90, tipo: "Curva", siguientes: [78] };
            sparseCasillasArray[80] = { esCurva: true, rotacion: 270, tipo: "Curva", siguientes: [90] };
            sparseCasillasArray[81] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [80] };
            sparseCasillasArray[82] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [81] };
            sparseCasillasArray[83] = { esCurva: true, rotacion: 90, tipo: "Curva", siguientes: [82] };
            sparseCasillasArray[84] = { esCurva: true, rotacion: 270, tipo: "Curva", siguientes: [94] };
            sparseCasillasArray[85] = { esCurva: true, rotacion: 90, tipo: "Curva", siguientes: [84] }; 
            sparseCasillasArray[87] = { esCurva: true, rotacion: 360, tipo: "Curva", siguientes: [77] }; 
            sparseCasillasArray[88] = { esCurva: true, rotacion: 90, tipo: "Curva", siguientes: [87] }; 
            sparseCasillasArray[90] = { esCurva: true, rotacion: 360, tipo: "Curva", siguientes: [91] };
            sparseCasillasArray[91] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [92] };
            sparseCasillasArray[92] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [93] };
            sparseCasillasArray[93] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [94] };
            sparseCasillasArray[94] = { esCurva: false, rotacion: 270, tipo: "Bifurcacion", siguientes: [95] };
            sparseCasillasArray[95] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [96] };
            sparseCasillasArray[96] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [97] };
            sparseCasillasArray[97] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [98] };
            sparseCasillasArray[98] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [99] };
            sparseCasillasArray[99] = { esCurva: false, rotacion: 90, tipo: "Meta", siguientes: [] };         
            //serpientes
            sparseCasillasArray[31] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [30], saltoA: 2 };
            sparseCasillasArray[76] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [75], saltoA: 47 };
            sparseCasillasArray[46] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [47], saltoA: 28 };
            sparseCasillasArray[18] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [19], saltoA: 5 };
            sparseCasillasArray[95] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [96], saltoA: 54 };
            sparseCasillasArray[80] = { esCurva: true, rotacion: 270, tipo: "Serpiente", siguientes: [90], saltoA: 61 };
            //escaleras
            sparseCasillasArray[17] = { esCurva: false, rotacion: 90, tipo: "Escalera", siguientes: [18], saltoA: 33 };
            sparseCasillasArray[41] = { esCurva: false, rotacion: 90, tipo: "Escalera", siguientes: [42], saltoA: 82 }; 
            sparseCasillasArray[65] = { esCurva: false, rotacion: 90, tipo: "Escalera", siguientes: [64], saltoA: 78 };  
            sparseCasillasArray[38] = { esCurva: false, rotacion: 90, tipo: "Escalera", siguientes: [37], saltoA: 59 };
            for(let i = 1; i <= 100; i++) {
                if(!sparseCasillasArray[i]) {
                    sparseCasillasArray[i] = { esCurva: false, rotacion: 90, tipo: "Vacía", siguientes: [] };
                }
            }
            return {
                casillas: sparseCasillasArray,
            };
            // Generar tablero 2
            break;
        case 3:
            for(let i =0;i<100;i++){
                sparseCasillasArray[i] = { esCurva: false, rotacion: 90, tipo: "Vacía", siguientes: [i+1] };
            }
            sparseCasillasArray[0] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [1] };
            sparseCasillasArray[1] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [2] };
            sparseCasillasArray[2] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [3] };
            sparseCasillasArray[3] = { esCurva: false, rotacion: 90, tipo: "Bifurcacion", siguientes: [4,13] };
            sparseCasillasArray[4] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [5] };
            sparseCasillasArray[5] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [6] };
            sparseCasillasArray[6] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [7] };
            sparseCasillasArray[7] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [8] };
            sparseCasillasArray[8] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [9] };
            sparseCasillasArray[9] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [10] };
            sparseCasillasArray[18] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [17] };
            sparseCasillasArray[17] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [16] };
            sparseCasillasArray[16] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [15] };
            sparseCasillasArray[15] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [14] };
            sparseCasillasArray[14] = { esCurva: true, rotacion: 270, tipo: "Curva", siguientes: [24] };   
            sparseCasillasArray[13] = { esCurva: false, rotacion: 0, tipo: "Normal", siguientes: [23] };
            sparseCasillasArray[23] = { esCurva: false, rotacion: 0, tipo: "Normal", siguientes: [33] };
            sparseCasillasArray[33] = { esCurva: true, rotacion: 90, tipo: "Curva", siguientes: [32] };
            sparseCasillasArray[32] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [31]};
            sparseCasillasArray[31] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [30],saltoA: 1 };
            sparseCasillasArray[30] = { esCurva: true, rotacion: 270, tipo: "Curva", siguientes: [40] };
            sparseCasillasArray[40] = { esCurva: true, rotacion: 360, tipo: "Curva", siguientes: [41] };
            sparseCasillasArray[41] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [42] };
            sparseCasillasArray[42] = { esCurva: true, rotacion: 180, tipo: "Serpiente", siguientes: [52],saltoA: 2 };
            sparseCasillasArray[52] = { esCurva: false, rotacion: 0, tipo: "Normal", siguientes: [62] };
            sparseCasillasArray[62] = { esCurva: false, rotacion: 0, tipo: "Serpiente", siguientes: [72],saltoA:33 };
            sparseCasillasArray[72] = { esCurva: true, rotacion: 90, tipo: "Curva", siguientes: [71] };
            sparseCasillasArray[71] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [70],saltoA:40 };
            sparseCasillasArray[70] = { esCurva: true, rotacion: 270, tipo: "Curva", siguientes: [80] };
            sparseCasillasArray[80] = { esCurva: true, rotacion: 360, tipo: "Curva", siguientes: [81] };
            sparseCasillasArray[81] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [82],saltoA:42 };
            sparseCasillasArray[82] = { esCurva: true, rotacion: 180, tipo: "Curva", siguientes: [92] };
            sparseCasillasArray[92] = { esCurva: true, rotacion: 360, tipo: "Serpiente", siguientes: [93],saltoA: 31 };
            sparseCasillasArray[93] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [94] };
            sparseCasillasArray[94] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [95] };
            sparseCasillasArray[95] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [96] };
            sparseCasillasArray[96] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [97] };
            sparseCasillasArray[97] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [98] };
            sparseCasillasArray[98] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [99] };
            sparseCasillasArray[99] = { esCurva: false, rotacion: 90, tipo: "Meta", siguientes: [] };
            for(let i = 5; i < 80; i++){ 
                const filaPar = Math.floor(i / 10) % 2 === 0;    
                if(i%10 >=4 && i%10 <= 9){
                    if((i+1) % 10 === 0){
                        if(filaPar) {
                            sparseCasillasArray[i] = { esCurva: true, rotacion: 180, tipo: "Curva", siguientes: [i+10] };
                        }else{
                            sparseCasillasArray[i] = { esCurva: true, rotacion: 90, tipo: "Curva", siguientes: [i-1] };
                        }
                    }else{
                        if((i+1)%10 ===5){
                            if(filaPar) {
                                sparseCasillasArray[i] = { esCurva: true, rotacion: 360, tipo: "Curva", siguientes: [i+1] };
                            }else{
                                sparseCasillasArray[i] = { esCurva: true, rotacion: 270, tipo: "Curva", siguientes: [i+10] };
                            }
                        }else{
                            if(filaPar) {
                                 sparseCasillasArray[i] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [i+1] };
                            }else{
                                sparseCasillasArray[i] = { esCurva: false, rotacion: 90, tipo: "Normal", siguientes: [i-1] };
                            }
                        }
                    } 
                }
            }
            sparseCasillasArray[84] = { esCurva: false, rotacion: 0, tipo: "Normal", siguientes: [94] };
            sparseCasillasArray[94] = { esCurva: false, rotacion: 270, tipo: "Bifurcacion", siguientes: [95] };
            //escaleras
            sparseCasillasArray[18] = { esCurva: false, rotacion: 90, tipo: "Escalera", siguientes: [17], saltoA: 37 };
            sparseCasillasArray[34] = { esCurva: true, rotacion: 270, tipo: "Escalera", siguientes: [44], saltoA: 75 };
            sparseCasillasArray[48] = { esCurva: false, rotacion: 90, tipo: "Escalera", siguientes: [49], saltoA: 77 };
            //serpientes
            sparseCasillasArray[16] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [26], saltoA: 4 };
            sparseCasillasArray[45] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [46], saltoA: 39 };
            sparseCasillasArray[76] = { esCurva: false, rotacion: 90, tipo: "Serpiente", siguientes: [75], saltoA: 55 };
            sparseCasillasArray[84] = { esCurva: false, rotacion: 0, tipo: "Serpiente", siguientes: [94], saltoA: 78 };
            // Generar tablero 3
            return {
                casillas: sparseCasillasArray,
            };
            break;
        default:
            // Generar tablero por defecto
    }

	return {
		casillas: sparseCasillasArray
	};
}
