import { useState } from 'react';
import { File } from '../types/file';
import { fileService } from '../services/fileService';

const useFileOperations = () => {
    const [files, setFiles] = useState<File[]>([]);

    const fetchFiles = async (folderId: string) => {
        const fetchedFiles = await fileService.getFiles(folderId);
        setFiles(fetchedFiles);
    };

    const createFile = async (newFile: File) => {
        const createdFile = await fileService.createFile(newFile);
        setFiles((prevFiles) => [...prevFiles, createdFile]);
    };

    const updateFile = async (updatedFile: File) => {
        const file = await fileService.updateFile(updatedFile);
        setFiles((prevFiles) =>
            prevFiles.map((f) => (f.id === file.id ? file : f))
        );
    };

    const deleteFile = async (fileId: string) => {
        await fileService.deleteFile(fileId);
        setFiles((prevFiles) => prevFiles.filter((f) => f.id !== fileId));
    };

    return {
        files,
        fetchFiles,
        createFile,
        updateFile,
        deleteFile,
    };
};

export default useFileOperations;