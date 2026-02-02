export const formatFileSize = (size: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let index = 0;

    while (size >= 1024 && index < units.length - 1) {
        size /= 1024;
        index++;
    }

    return `${size.toFixed(2)} ${units[index]}`;
};

export const validateFileType = (fileName: string, allowedTypes: string[]): boolean => {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    return fileExtension ? allowedTypes.includes(fileExtension) : false;
};

export const generateUniqueId = (): string => {
    return 'file_' + Math.random().toString(36).substr(2, 9);
};