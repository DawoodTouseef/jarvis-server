export interface Folder {
    id: string;
    name: string;
    files: string[]; // Array of file IDs or file objects
    subfolders: Folder[]; // Array of subfolder objects
}