declare module 'mammoth' {
    export interface ExtractResult {
        value: string;
        messages: any[];
    }

    export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<ExtractResult>;
}
