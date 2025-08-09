import { useEffect } from 'react';
import { IFiles } from '../../types';

export default function useIpcCommunication(setFiles) {
  useEffect(() => {
    window?.ipc?.on('file-selected', (res: IFiles[]) => {
      setFiles((prevFiles) => [...prevFiles, ...res]);
    });

    const handleTaskStatusChange = (
      res: IFiles,
      key: string,
      status: string,
    ) => {
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.uuid === res?.uuid ? { ...file, [key]: status } : file,
        ),
      );
    };

    const handleTaskProgressChange = (
      res: IFiles,
      key: string,
      progress: number,
    ) => {
      setFiles((prevFiles) => {
        const progressKey = `${key}Progress`;
        return prevFiles.map((file) =>
          file.uuid === res?.uuid ? { ...file, [progressKey]: progress } : file,
        );
      });
    };

    const handleTaskErrorChange = (
      res: IFiles,
      key: string,
      errorMsg: string,
    ) => {
      setFiles((prevFiles) => {
        const errorKey = `${key}Error`;
        return prevFiles.map((file) =>
          file.uuid === res?.uuid ? { ...file, [errorKey]: errorMsg } : file,
        );
      });
    };

    const handleFileChange = (res: IFiles) => {
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.uuid === res?.uuid ? { ...file, ...res } : file,
        ),
      );
    };

    window?.ipc?.on('taskStatusChange', handleTaskStatusChange);
    window?.ipc?.on('taskProgressChange', handleTaskProgressChange);
    window?.ipc?.on('taskErrorChange', handleTaskErrorChange);
    window?.ipc?.on('taskFileChange', handleFileChange);
    return () => {};
  }, []);
}
