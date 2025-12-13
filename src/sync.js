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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllSyncs = runAllSyncs;
var consola_1 = require("consola");
var db_1 = require("./db");
var config_1 = require("./config");
var pg_query_stream_1 = require("pg-query-stream");
var syncmarkers_1 = require("./syncmarkers");
function runAllSyncs() {
    return __awaiter(this, void 0, void 0, function () {
        var client, syncTables, _i, syncTables_1, table, t0, t1, dt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    consola_1.consola.info("Starting full sync...");
                    return [4 /*yield*/, db_1.pool.connect()];
                case 1:
                    client = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, , 7, 8]);
                    syncTables = config_1.config.syncTables;
                    _i = 0, syncTables_1 = syncTables;
                    _a.label = 3;
                case 3:
                    if (!(_i < syncTables_1.length)) return [3 /*break*/, 6];
                    table = syncTables_1[_i];
                    t0 = new Date().getTime();
                    consola_1.consola.info("Syncing table: ".concat(table.tableKey));
                    return [4 /*yield*/, syncSingleTable(client, table)];
                case 4:
                    _a.sent();
                    t1 = new Date().getTime();
                    dt = t1 - t0;
                    consola_1.consola.success("Finished syncing table: ".concat(table.tableKey, " in ").concat((t1 - t0), "ms"));
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 8];
                case 7:
                    client.release();
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function syncSingleTable(client, table) {
    return __awaiter(this, void 0, void 0, function () {
        var rowCount, syncMarker, exhaustiveCheck, exhaustiveCheck, now, maxId, params, query, stream, _a, stream_1, stream_1_1, row, id, e_1_1, newMarker, newMarker, exhaustiveCheck;
        var _b, e_1, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (!table.enabled) {
                        consola_1.consola.info("Skipping disabled sync: ".concat(table.tableKey));
                        return [2 /*return*/];
                    }
                    consola_1.consola.info("Running sync: ".concat(table.tableKey, " with query: ").concat(table.query));
                    rowCount = 0;
                    return [4 /*yield*/, (0, syncmarkers_1.getSyncMarker)(table.tableKey)];
                case 1:
                    syncMarker = _e.sent();
                    if (!syncMarker) {
                        switch (table.syncType) {
                            case "full":
                                /* do nothing, sync all rows */
                                break;
                            case "timestamp":
                                syncMarker = new Date(0).toISOString(); // 24 hours ago
                                break;
                            case "id_increment":
                                syncMarker = "0"; // Start from ID 0
                                break;
                            default:
                                exhaustiveCheck = table.syncType;
                                throw new Error("Unhandled sync type: ".concat(exhaustiveCheck));
                        }
                    }
                    switch (table.syncType) {
                        case "full":
                            consola_1.consola.info("Full sync");
                            break;
                        case "timestamp":
                            consola_1.consola.info("Using sync marker (timestamp): ".concat(syncMarker));
                            break;
                        case "id_increment":
                            consola_1.consola.info("Using sync marker (id_increment): ".concat(syncMarker));
                            break;
                        default:
                            exhaustiveCheck = table.syncType;
                            throw new Error("Unhandled sync type: ".concat(exhaustiveCheck));
                    }
                    now = new Date();
                    maxId = -1;
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, , 15, 16]);
                    params = [];
                    if (syncMarker) {
                        params.push(syncMarker);
                    }
                    query = new pg_query_stream_1.default(table.query, params);
                    consola_1.consola.info("Executing query for table: ".concat(table.tableKey), table.query, params);
                    stream = client.query(query);
                    now = new Date();
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 8, 9, 14]);
                    _a = true, stream_1 = __asyncValues(stream);
                    _e.label = 4;
                case 4: return [4 /*yield*/, stream_1.next()];
                case 5:
                    if (!(stream_1_1 = _e.sent(), _b = stream_1_1.done, !_b)) return [3 /*break*/, 7];
                    _d = stream_1_1.value;
                    _a = false;
                    row = _d;
                    if (table.syncType === "id_increment") {
                        id = parseInt(row[table.primaryKey]);
                        if (id > maxId) {
                            maxId = id;
                        }
                    }
                    consola_1.consola.log("Processing row" + JSON.stringify(row));
                    rowCount++;
                    if (rowCount % 1000 === 0) {
                        consola_1.consola.info("Processed ".concat(rowCount, " rows for table: ").concat(table.tableKey));
                    }
                    _e.label = 6;
                case 6:
                    _a = true;
                    return [3 /*break*/, 4];
                case 7: return [3 /*break*/, 14];
                case 8:
                    e_1_1 = _e.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 14];
                case 9:
                    _e.trys.push([9, , 12, 13]);
                    if (!(!_a && !_b && (_c = stream_1.return))) return [3 /*break*/, 11];
                    return [4 /*yield*/, _c.call(stream_1)];
                case 10:
                    _e.sent();
                    _e.label = 11;
                case 11: return [3 /*break*/, 13];
                case 12:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 13: return [7 /*endfinally*/];
                case 14: return [3 /*break*/, 16];
                case 15:
                    consola_1.consola.info("Completed sync for table: ".concat(table.tableKey));
                    return [7 /*endfinally*/];
                case 16:
                    switch (table.syncType) {
                        case "timestamp":
                            if (rowCount > 0) {
                                newMarker = now.toISOString();
                                consola_1.consola.info("Updating sync marker for ".concat(table.tableKey, " to ").concat(newMarker));
                                (0, syncmarkers_1.setSyncMarker)(table.tableKey, newMarker);
                            }
                            break;
                        case "id_increment":
                            if (rowCount > 0) {
                                newMarker = maxId.toString();
                                consola_1.consola.info("Updating sync marker for ".concat(table.tableKey, " to ").concat(newMarker));
                                (0, syncmarkers_1.setSyncMarker)(table.tableKey, newMarker);
                            }
                            break;
                        case "full":
                            /* no sync marker to update */
                            break;
                        default:
                            exhaustiveCheck = table.syncType;
                            throw new Error("Unhandled sync type: ".concat(exhaustiveCheck));
                    }
                    consola_1.consola.info("Table ".concat(table.tableKey, " synced, total rows: ").concat(rowCount));
                    return [2 /*return*/];
            }
        });
    });
}
