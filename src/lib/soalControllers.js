import * as SoalTAController from "@/lib/routes/soalTA";
import * as SoalTKController from "@/lib/routes/soalTK";
import * as SoalTPController from "@/lib/routes/soalTP";
import * as SoalFITBController from "@/lib/routes/soalFITB";
import * as SoalJurnalController from "@/lib/routes/soalJurnal";
import * as SoalTMController from "@/lib/routes/soalTM";

const SOAL_CONTROLLERS = {
    ta: SoalTAController,
    tk: SoalTKController,
    tp: SoalTPController,
    fitb: SoalFITBController,
    jurnal: SoalJurnalController,
    tm: SoalTMController,
};

export const getSoalController = (kategori) => SOAL_CONTROLLERS[kategori];

export { SOAL_CONTROLLERS };
