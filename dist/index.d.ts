import { Duplex } from "readable-stream";
export declare class ObjectMultiplex extends Duplex {
    _substreams: {
        [name: string]: Duplex | undefined;
    };
    constructor(_opts?: any);
    createStream(name: string): Substream;
    ignoreStream(name: string): void;
    _read(): void;
    _write(chunk: any, _encoding: any, callback: any): any;
}
declare class Substream extends Duplex {
    _parent: any;
    _name: string;
    constructor(obj: {
        parent: any;
        name: string;
    });
    _read(): void;
    _write(chunk: any, _enc: any, callback: any): void;
}
export default ObjectMultiplex;
