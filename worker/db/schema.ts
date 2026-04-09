import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, unique } from "drizzle-orm/sqlite-core";

const defaultNow = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;
const uuid = () => crypto.randomUUID();

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const users = sqliteTable("users", {
    id: text("id").primaryKey().$defaultFn(uuid),
    identifier: text("identifier").notNull().unique(), // nim (praktikan) or kode (asisten)
    passwordHash: text("password_hash").notNull(),
    userType: text("user_type").notNull(), // "asisten" | "praktikan"
    permissions: text("permissions").notNull().default("[]"), // JSON string[]
    name: text("name").notNull(),
    // praktikan fields
    nim: text("nim").unique(),
    alamat: text("alamat"),
    nomorTelepon: text("nomor_telepon"),
    email: text("email").unique(),
    profilePicture: text("profile_picture"),
    kelasId: text("kelas_id"),
    dk: text("dk"),
    // asisten fields
    kode: text("kode").unique(),
    asistenRole: text("asisten_role"), // "KORDAS"|"WAKORDAS"|"SOFTWARE"|"HARDWARE"|"ASLAB"
    deskripsi: text("deskripsi"),
    idLine: text("id_line"),
    instagram: text("instagram"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const sessions = sqliteTable("sessions", {
    id: text("id").primaryKey().$defaultFn(uuid),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
});

export const roles = sqliteTable("roles", {
    id: text("id").primaryKey().$defaultFn(uuid),
    name: text("name").notNull().unique(),
    permissions: text("permissions").notNull().default("[]"),
    paket: text("paket").notNull().default("[]"),
    guardName: text("guard_name").notNull().default("asisten"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

// ---------------------------------------------------------------------------
// Core LMS
// ---------------------------------------------------------------------------

export const kelas = sqliteTable("kelas", {
    id: text("id").primaryKey().$defaultFn(uuid),
    kelas: text("kelas", { length: 10 }).notNull(),
    hari: text("hari").notNull(),
    shift: integer("shift").notNull(),
    isEnglish: integer("is_english", { mode: "boolean" }).default(false).notNull(),
    totalGroup: integer("total_group"),
    isTot: integer("is_tot", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const moduls = sqliteTable("moduls", {
    id: text("id").primaryKey().$defaultFn(uuid),
    nama: text("nama").notNull(),
    isEnglish: integer("is_english", { mode: "boolean" }).default(false),
    isUnlocked: integer("is_unlocked", { mode: "boolean" }).default(false).notNull(),
    unlockConfig: text("unlock_config"), // JSON
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const praktikums = sqliteTable("praktikums", {
    id: text("id").primaryKey().$defaultFn(uuid),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    kelasId: text("kelas_id").notNull().references(() => kelas.id, { onDelete: "cascade" }),
    pjId: text("pj_id").references(() => users.id, { onDelete: "set null" }), // asisten penanggung jawab
    dk: text("dk", { length: 10 }).notNull().default("DK1"),
    isActive: integer("is_active", { mode: "boolean" }).default(false).notNull(),
    status: text("status").notNull().default("idle"), // "idle"|"ongoing"|"ended"
    currentPhase: text("current_phase"), // "tp"|"jurnal"|"tk"|"ta"|"mandiri"|null
    phaseStartedAt: integer("phase_started_at", { mode: "timestamp_ms" }),
    phaseElapsedSeconds: integer("phase_elapsed_seconds").default(0),
    startedAt: integer("started_at", { mode: "timestamp_ms" }),
    endedAt: integer("ended_at", { mode: "timestamp_ms" }),
    reportNotes: text("report_notes"),
    reportSubmittedAt: integer("report_submitted_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

// ---------------------------------------------------------------------------
// Questions (soal)
// ---------------------------------------------------------------------------

export const soalFitbs = sqliteTable("soal_fitbs", {
    id: text("id").primaryKey().$defaultFn(uuid),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    soal: text("soal").notNull(),
    enableFileUpload: integer("enable_file_upload", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const soalJurnals = sqliteTable("soal_jurnals", {
    id: text("id").primaryKey().$defaultFn(uuid),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    soal: text("soal").notNull(),
    enableFileUpload: integer("enable_file_upload", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const soalMandiris = sqliteTable("soal_mandiris", {
    id: text("id").primaryKey().$defaultFn(uuid),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    soal: text("soal").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

// soal_opsis: shared multiple-choice options for soal_tas and soal_tks
export const soalOpsis = sqliteTable("soal_opsis", {
    id: text("id").primaryKey().$defaultFn(uuid),
    soalType: text("soal_type", { length: 5 }).notNull(), // "ta" | "tk"
    soalId: text("soal_id").notNull(),
    text: text("text").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
});

export const soalTas = sqliteTable("soal_tas", {
    id: text("id").primaryKey().$defaultFn(uuid),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    soal: text("soal").notNull(),
    // Option references (4 choices, one correct)
    opsi1Id: text("opsi1_id").references(() => soalOpsis.id, { onDelete: "set null" }),
    opsi2Id: text("opsi2_id").references(() => soalOpsis.id, { onDelete: "set null" }),
    opsi3Id: text("opsi3_id").references(() => soalOpsis.id, { onDelete: "set null" }),
    opsiBenarId: text("opsi_benar_id").references(() => soalOpsis.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const soalTks = sqliteTable("soal_tks", {
    id: text("id").primaryKey().$defaultFn(uuid),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    soal: text("soal").notNull(),
    // For TK, opsi_id points to the correct answer option
    opsiId: text("opsi_id").references(() => soalOpsis.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const soalTps = sqliteTable("soal_tps", {
    id: text("id").primaryKey().$defaultFn(uuid),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    soal: text("soal").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const soalComments = sqliteTable("soal_comments", {
    id: text("id").primaryKey().$defaultFn(uuid),
    soalType: text("soal_type", { length: 10 }).notNull(), // "fitb"|"jurnal"|"mandiri"|"ta"|"tk"|"tp"
    soalId: text("soal_id").notNull(),
    asistenId: text("asisten_id").references(() => users.id, { onDelete: "set null" }),
    comment: text("comment").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

// ---------------------------------------------------------------------------
// Answers (jawaban)
// ---------------------------------------------------------------------------

export const jawabanFitbs = sqliteTable("jawaban_fitbs", {
    id: text("id").primaryKey().$defaultFn(uuid),
    praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    soalId: text("soal_id").notNull().references(() => soalFitbs.id, { onDelete: "cascade" }),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    jawaban: text("jawaban").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const jawabanJurnals = sqliteTable("jawaban_jurnals", {
    id: text("id").primaryKey().$defaultFn(uuid),
    praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    soalId: text("soal_id").notNull().references(() => soalJurnals.id, { onDelete: "cascade" }),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    jawaban: text("jawaban").notNull(),
    fileUrl: text("file_url"),
    fileName: text("file_name"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const jawabanMandiris = sqliteTable("jawaban_mandiris", {
    id: text("id").primaryKey().$defaultFn(uuid),
    praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    soalId: text("soal_id").notNull().references(() => soalMandiris.id, { onDelete: "cascade" }),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    jawaban: text("jawaban").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const jawabanTas = sqliteTable(
    "jawaban_tas",
    {
        id: text("id").primaryKey().$defaultFn(uuid),
        praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        soalId: text("soal_id").notNull().references(() => soalTas.id, { onDelete: "cascade" }),
        modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
        opsiId: text("opsi_id").references(() => soalOpsis.id, { onDelete: "set null" }),
        createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
    },
    t => ({ uniq: unique("jawaban_tas_soal_praktikan_unique").on(t.soalId, t.praktikanId) }),
);

export const jawabanTks = sqliteTable(
    "jawaban_tks",
    {
        id: text("id").primaryKey().$defaultFn(uuid),
        praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        soalId: text("soal_id").notNull().references(() => soalTks.id, { onDelete: "cascade" }),
        modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
        opsiId: text("opsi_id").references(() => soalOpsis.id, { onDelete: "set null" }),
        createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
    },
    t => ({ uniq: unique("jawaban_tks_soal_praktikan_unique").on(t.soalId, t.praktikanId) }),
);

export const jawabanTps = sqliteTable("jawaban_tps", {
    id: text("id").primaryKey().$defaultFn(uuid),
    praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    soalId: text("soal_id").notNull().references(() => soalTps.id, { onDelete: "cascade" }),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    jawaban: text("jawaban").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

// Autosave snapshots for TP answers (temp in-progress)
export const tempJawabantps = sqliteTable("temp_jawabantps", {
    id: text("id").primaryKey().$defaultFn(uuid),
    praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    soalId: text("soal_id").notNull().references(() => soalTps.id, { onDelete: "cascade" }),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    jawaban: text("jawaban").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const tempSoaljurnals = sqliteTable("temp_soaljurnals", {
    id: text("id").primaryKey().$defaultFn(uuid),
    praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    soalId: text("soal_id").notNull().references(() => soalJurnals.id, { onDelete: "cascade" }),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    jawaban: text("jawaban").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const autosaveSnapshots = sqliteTable(
    "autosave_snapshots",
    {
        id: text("id").primaryKey().$defaultFn(uuid),
        praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
        tipeSoal: text("tipe_soal").notNull(),
        jawaban: text("jawaban").notNull().default("{}"),
        createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
    },
    (t) => ({ uniq: unique("autosave_snapshots_praktikan_modul_tipe_unique").on(t.praktikanId, t.modulId, t.tipeSoal) }),
);

export const autosaveQuestionSnapshots = sqliteTable(
    "autosave_question_snapshots",
    {
        id: text("id").primaryKey().$defaultFn(uuid),
        praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
        tipeSoal: text("tipe_soal").notNull(),
        questionIds: text("question_ids").notNull().default("[]"),
        createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
    },
    (t) => ({ uniq: unique("autosave_question_snapshots_praktikan_modul_tipe_unique").on(t.praktikanId, t.modulId, t.tipeSoal) }),
);

// TP submission tracking (whether praktikan has submitted TP for a modul)
export const kumpulTps = sqliteTable("kumpul_tps", {
    id: text("id").primaryKey().$defaultFn(uuid),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    kelasId: text("kelas_id").notNull().references(() => kelas.id, { onDelete: "cascade" }),
    praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

export const nilais = sqliteTable("nilais", {
    id: text("id").primaryKey().$defaultFn(uuid),
    tp: real("tp").notNull(),
    ta: real("ta").notNull(),
    d1: real("d1").notNull(),
    d2: real("d2").notNull(),
    d3: real("d3").notNull(),
    d4: real("d4").notNull(),
    l1: real("l1").notNull(),
    l2: real("l2").notNull(),
    avg: real("avg").notNull(),
    rating: real("rating"),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    asistenId: text("asisten_id").references(() => users.id, { onDelete: "set null" }),
    kelasId: text("kelas_id").notNull().references(() => kelas.id, { onDelete: "cascade" }),
    praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const nilaiComplaints = sqliteTable("nilai_complaints", {
    id: text("id").primaryKey().$defaultFn(uuid),
    nilaiId: text("nilai_id").notNull().references(() => nilais.id, { onDelete: "cascade" }),
    praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    notes: text("notes"),
    status: text("status").notNull().default("pending"), // "pending"|"resolved"|"rejected"
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const laporanPraktikans = sqliteTable("laporan_praktikans", {
    id: text("id").primaryKey().$defaultFn(uuid),
    praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    asistenId: text("asisten_id").references(() => users.id, { onDelete: "set null" }),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    pesan: text("pesan").notNull(),
    ratingPraktikum: real("rating_praktikum"),
    ratingAsisten: real("rating_asisten"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

// ---------------------------------------------------------------------------
// Tugas Pendahuluan (Pre-lab Tasks)
// ---------------------------------------------------------------------------

export const tugasPendahuluans = sqliteTable("tugas_pendahuluans", {
    id: text("id").primaryKey().$defaultFn(uuid),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    soal: text("soal").notNull(),
    jawabanBenar: text("jawaban_benar").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const tugasPendahuluanKelas = sqliteTable("tugas_pendahuluan_kelas", {
    id: text("id").primaryKey().$defaultFn(uuid),
    tugasPendahuluanId: text("tugas_pendahuluan_id").notNull().references(() => tugasPendahuluans.id, { onDelete: "cascade" }),
    kelasId: text("kelas_id").notNull().references(() => kelas.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

// ---------------------------------------------------------------------------
// Polling / Surveys
// ---------------------------------------------------------------------------

export const jenisPollings = sqliteTable("jenis_pollings", {
    id: text("id").primaryKey().$defaultFn(uuid),
    judul: text("judul").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const pollings = sqliteTable("pollings", {
    id: text("id").primaryKey().$defaultFn(uuid),
    pollingId: text("polling_id").notNull().references(() => jenisPollings.id, { onDelete: "cascade" }),
    asistenId: text("asisten_id").references(() => users.id, { onDelete: "set null" }),
    praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

// ---------------------------------------------------------------------------
// Resources & Misc
// ---------------------------------------------------------------------------

export const resources = sqliteTable("resources", {
    id: text("id").primaryKey().$defaultFn(uuid),
    modulId: text("modul_id").notNull().references(() => moduls.id, { onDelete: "cascade" }),
    modulLink: text("modul_link").notNull(),
    pptLink: text("ppt_link").notNull(),
    videoLink: text("video_link").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const feedback = sqliteTable("feedback", {
    id: text("id").primaryKey().$defaultFn(uuid),
    asistenId: text("asisten_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    praktikanId: text("praktikan_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kelasId: text("kelas_id").notNull().references(() => kelas.id, { onDelete: "cascade" }),
    pesan: text("pesan").notNull(),
    read: integer("read", { mode: "boolean" }).default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const fotoAsistens = sqliteTable("foto_asistens", {
    id: text("id").primaryKey().$defaultFn(uuid),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    fotoUrl: text("foto_url").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const jadwalJagas = sqliteTable("jadwal_jagas", {
    id: text("id").primaryKey().$defaultFn(uuid),
    kelasId: text("kelas_id").notNull().references(() => kelas.id, { onDelete: "cascade" }),
    asistenId: text("asisten_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const configurations = sqliteTable("configurations", {
    id: text("id").primaryKey().$defaultFn(uuid),
    configKey: text("key").notNull().unique(),
    value: text("value"),
    type: text("type"), // "string"|"boolean"|"number"|"json"
    // TP schedule
    tpScheduleEnabled: integer("tp_schedule_enabled", { mode: "boolean" }).default(false),
    tpScheduleStartAt: integer("tp_schedule_start_at", { mode: "timestamp_ms" }),
    tpScheduleEndAt: integer("tp_schedule_end_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
    id: text("id").primaryKey().$defaultFn(uuid),
    asistenId: text("asisten_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    route: text("route"),
    method: text("method", { length: 16 }).notNull(),
    description: text("description"),
    metadata: text("metadata"), // JSON
    ipAddress: text("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(defaultNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(defaultNow).$onUpdate(() => new Date()).notNull(),
});
