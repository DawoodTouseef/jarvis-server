import { useState } from 'react';
import { Folder } from '../types/folder';
import { createFolder, updateFolder, deleteFolder } from '../services/folderService';

const useFolderOperations = () => {
    const [folders, setFolders] = useState<Folder[]>([]);

    const addFolder = async (name: string, parentId?: string) => {
        const newFolder = await createFolder(name, parentId);
        setFolders(prev => [...prev, newFolder]);
    };

    const editFolder = async (id: string, newName: string) => {
        const updatedFolder = await updateFolder(id, newName);
        setFolders(prev => prev.map(folder => (folder.id === id ? updatedFolder : folder)));
    };

    const removeFolder = async (id: string) => {
        await deleteFolder(id);
        setFolders(prev => prev.filter(folder => folder.id !== id));
    };

    return {
        folders,
        addFolder,
        editFolder,
        removeFolder,
    };
};

export default useFolderOperations;