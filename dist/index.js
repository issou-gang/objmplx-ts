"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectMultiplex = void 0;
var readable_stream_1 = require("readable-stream");
var end_of_stream_1 = __importDefault(require("end-of-stream"));
var once_1 = __importDefault(require("once"));
var IGNORE_SUBSTREAM = undefined;
function anyStreamEnd(stream, _cb) {
    var cb = once_1.default(_cb);
    end_of_stream_1.default(stream, { readable: false }, cb);
    end_of_stream_1.default(stream, { writable: false }, cb);
}
var ObjectMultiplex = /** @class */ (function (_super) {
    __extends(ObjectMultiplex, _super);
    function ObjectMultiplex(_opts) {
        if (_opts === void 0) { _opts = {}; }
        var _this = this;
        var opts = Object.assign({}, _opts, {
            objectMode: true,
        });
        _this = _super.call(this, opts) || this;
        _this._substreams = {};
        return _this;
    }
    ObjectMultiplex.prototype.createStream = function (name) {
        if (!name)
            throw new Error("ObjectMultiplex - name must not be empty");
        if (this._substreams[name])
            throw new Error('ObjectMultiplex - Substream for name "${name}" already exists');
        // create substream
        var substream = new Substream({ parent: this, name: name });
        this._substreams[name] = substream;
        // listen for parent stream to end
        anyStreamEnd(this, function (err) {
            substream.destroy(err);
        });
        return substream;
    };
    // ignore streams (dont display orphaned data warning)
    ObjectMultiplex.prototype.ignoreStream = function (name) {
        if (!name)
            throw new Error("ObjectMultiplex - name must not be empty");
        if (this._substreams[name])
            throw new Error('ObjectMultiplex - Substream for name "${name}" already exists');
        // set
        this._substreams[name] = IGNORE_SUBSTREAM;
    };
    // stream plumbing
    ObjectMultiplex.prototype._read = function () { };
    ObjectMultiplex.prototype._write = function (chunk, _encoding, callback) {
        // parse message
        var name = chunk.name;
        var data = chunk.data;
        if (!name) {
            console.warn("ObjectMultiplex - malformed chunk without name \"" + chunk + "\"");
            return callback();
        }
        // get corresponding substream
        var substream = this._substreams[name];
        if (!substream) {
            console.warn("ObjectMultiplex - orphaned data for stream \"" + name + "\"");
            return callback();
        }
        // push data into substream
        if (substream !== IGNORE_SUBSTREAM) {
            substream.push(data);
        }
        callback();
    };
    return ObjectMultiplex;
}(readable_stream_1.Duplex));
exports.ObjectMultiplex = ObjectMultiplex;
var Substream = /** @class */ (function (_super) {
    __extends(Substream, _super);
    function Substream(obj) {
        var _this = _super.call(this, {
            objectMode: true,
        }) || this;
        _this._parent = obj.parent;
        _this._name = obj.name;
        return _this;
    }
    Substream.prototype._read = function () { };
    Substream.prototype._write = function (chunk, _enc, callback) {
        this._parent.push({
            name: this._name,
            data: chunk,
        });
        callback();
    };
    return Substream;
}(readable_stream_1.Duplex));
exports.default = ObjectMultiplex;
//# sourceMappingURL=index.js.map