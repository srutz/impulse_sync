"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.bootstrapConfig = bootstrapConfig;
var promises_1 = require("fs/promises");
var fs_1 = require("fs");
var consola_1 = require("consola");
var paths_1 = require("./paths");
var config = null;
exports.config = config;
var syncMarkers = null;
function bootstrapConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, defaultConfig, _b, defaultMarkers;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // Ensure directory exists
                return [4 /*yield*/, (0, promises_1.mkdir)(paths_1.CONFIG_DIR, { recursive: true })];
                case 1:
                    // Ensure directory exists
                    _c.sent();
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 4, , 6]);
                    return [4 /*yield*/, (0, promises_1.access)(paths_1.CONFIG_PATH, fs_1.constants.F_OK)];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 6];
                case 4:
                    _a = _c.sent();
                    defaultConfig = {
                        postgres: {
                            host: "localhost",
                            port: 5432,
                            user: "postgres",
                            password: "your_password",
                            database: "your_database"
                        },
                        syncTables: []
                    };
                    return [4 /*yield*/, (0, promises_1.writeFile)(paths_1.CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), "utf-8")];
                case 5:
                    _c.sent();
                    consola_1.consola.info("Created default config at ".concat(paths_1.CONFIG_PATH, ". Please update it with your settings."));
                    return [3 /*break*/, 6];
                case 6:
                    _c.trys.push([6, 8, , 10]);
                    return [4 /*yield*/, (0, promises_1.access)(paths_1.MARKERS_PATH, fs_1.constants.F_OK)];
                case 7:
                    _c.sent();
                    return [3 /*break*/, 10];
                case 8:
                    _b = _c.sent();
                    defaultMarkers = {
                        changedTs: new Date().toISOString(),
                        markers: {}
                    };
                    return [4 /*yield*/, (0, promises_1.writeFile)(paths_1.MARKERS_PATH, JSON.stringify(defaultMarkers, null, 2), "utf-8")];
                case 9:
                    _c.sent();
                    consola_1.consola.info("Created default sync markers at ".concat(paths_1.MARKERS_PATH, "."));
                    return [3 /*break*/, 10];
                case 10: return [4 /*yield*/, loadConfig(paths_1.CONFIG_PATH)];
                case 11:
                    exports.config = config = _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function loadConfig(path) {
    return __awaiter(this, void 0, void 0, function () {
        var content;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, promises_1.readFile)(path, "utf-8")];
                case 1:
                    content = _a.sent();
                    return [2 /*return*/, JSON.parse(content)];
            }
        });
    });
}
