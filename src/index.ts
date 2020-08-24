import { Duplex } from "readable-stream";
import endOfStream from "end-of-stream";
import once from "once";

const IGNORE_SUBSTREAM = undefined;

function anyStreamEnd(stream: any, _cb: any) {
  const cb = once(_cb);
  endOfStream(stream, { readable: false }, cb);
  endOfStream(stream, { writable: false }, cb);
}

export class ObjectMultiplex extends Duplex {
  _substreams: { [name: string]: Duplex | undefined };

  constructor(_opts: any = {}) {
    const opts = Object.assign({}, _opts, {
      objectMode: true,
    });
    super(opts);

    this._substreams = {};
  }

  createStream(name: string) {
    if (!name) throw new Error("ObjectMultiplex - name must not be empty");
    if (this._substreams[name])
      throw new Error(
        'ObjectMultiplex - Substream for name "${name}" already exists'
      );

    // create substream
    const substream = new Substream({ parent: this, name: name });
    this._substreams[name] = substream;

    // listen for parent stream to end
    anyStreamEnd(this, (err: Error) => {
      substream.destroy(err);
    });

    return substream;
  }

  // ignore streams (dont display orphaned data warning)
  ignoreStream(name: string) {
    if (!name) throw new Error("ObjectMultiplex - name must not be empty");
    if (this._substreams[name])
      throw new Error(
        'ObjectMultiplex - Substream for name "${name}" already exists'
      );
    // set
    this._substreams[name] = IGNORE_SUBSTREAM;
  }

  // stream plumbing

  _read() {}

  _write(chunk: any, _encoding: any, callback: any) {
    // parse message
    const name = chunk.name;
    const data = chunk.data;
    if (!name) {
      console.warn(`ObjectMultiplex - malformed chunk without name "${chunk}"`);
      return callback();
    }

    // get corresponding substream
    const substream = this._substreams[name];
    if (!substream) {
      console.warn(`ObjectMultiplex - orphaned data for stream "${name}"`);
      return callback();
    }

    // push data into substream
    if (substream !== IGNORE_SUBSTREAM) {
      substream.push(data);
    }

    callback();
  }
}

class Substream extends Duplex {
  _parent: any;
  _name: string;
  constructor(obj: { parent: any; name: string }) {
    super({
      objectMode: true,
    });

    this._parent = obj.parent;
    this._name = obj.name;
  }

  _read() {}

  _write(chunk: any, _enc: any, callback: any) {
    this._parent.push({
      name: this._name,
      data: chunk,
    });
    callback();
  }
}

export default ObjectMultiplex;
