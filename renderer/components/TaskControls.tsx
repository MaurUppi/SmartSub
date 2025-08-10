import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { isSubtitleFile } from 'lib/utils';
import { useTranslation } from 'next-i18next';

const TaskControls = ({ files, formData }) => {
  const [taskStatus, setTaskStatus] = useState('idle');
  const { t } = useTranslation(['home', 'common']);

  useEffect(() => {
    // 获取当前任务状态
    const getCurrentTaskStatus = async () => {
      const status = await window?.ipc?.invoke('getTaskStatus');
      setTaskStatus(status);
    };
    getCurrentTaskStatus().catch(console.error);

    // 监听任务状态变化
    const cleanup = window?.ipc?.on('taskComplete', (status: string) => {
      setTaskStatus(status);
    });

    return () => {
      cleanup?.();
    };
  }, []);

  const handleTask = async () => {
    if (!files?.length) {
      toast(t('common:notification'), {
        description: t('home:noTask'),
      });
      return;
    }
    const isAllFilesProcessed = files.every((item: any) => {
      const basicProcessingDone = item.extractAudio && item.extractSubtitle;

      if (formData.translateProvider === '-1') {
        return basicProcessingDone;
      }
      if (isSubtitleFile(item?.filePath)) {
        return item.translateSubtitle;
      }

      return basicProcessingDone && item.translateSubtitle;
    });

    if (isAllFilesProcessed) {
      toast(t('common:notification'), {
        description: t('home:allFilesProcessed'),
      });
      return;
    }
    // if(formData.model && needsCoreML(formData.model)){
    //   const checkMlmodel = await window.ipc.invoke('checkMlmodel', formData.model);
    //   if(!checkMlmodel){
    //     toast(t('common:notification'), {
    //       description: t('home:missingEncoderMlmodelc'),
    //     });
    //     return;
    //   }
    // }
    setTaskStatus('running');
    window?.ipc?.send('handleTask', { files, formData });
  };
  // Note: Pause functionality is limited due to whisper.cpp addon limitations
  // Processing continues in background, only UI updates are paused
  // const handlePause = () => {
  //   window?.ipc?.send('pauseTask', null);
  //   setTaskStatus('paused');
  // };

  const handleResume = () => {
    // Resume UI updates - processing was never actually paused
    window?.ipc?.send('resumeTask', null);
    setTaskStatus('running');
  };

  // Note: Cancel functionality is limited due to whisper.cpp addon limitations
  // Processing will continue until natural completion
  // const handleCancel = () => {
  //   window?.ipc?.send('cancelTask', null);
  //   setTaskStatus('cancelled');
  // };
  return (
    <div className="flex gap-2 ml-auto">
      {(taskStatus === 'idle' || taskStatus === 'completed') && (
        <Button onClick={handleTask} disabled={!files.length}>
          {t('home:startTask')}
        </Button>
      )}
      {taskStatus === 'running' && (
        <>
          <Button
            disabled={true}
            title="Processing cannot be stopped due to technical limitations"
            className="cursor-not-allowed opacity-50"
          >
            {t('home:pauseTask')}
          </Button>
          <Button
            disabled={true}
            title="Processing cannot be stopped due to technical limitations"
            className="cursor-not-allowed opacity-50"
          >
            {t('home:cancelTask')}
          </Button>
        </>
      )}
      {taskStatus === 'paused' && (
        <>
          <Button
            onClick={handleResume}
            title={t(
              'common:resume_processing',
              'Resume processing (UI only - processing continues in background)',
            )}
          >
            {t('home:resumeTask')}
          </Button>
          <Button
            disabled={true}
            title="Processing cannot be stopped due to technical limitations"
            className="cursor-not-allowed opacity-50"
          >
            {t('home:cancelTask')}
          </Button>
        </>
      )}
      {taskStatus === 'cancelled' && (
        <Button onClick={handleTask} disabled={!files.length}>
          {t('home:restartTask')}
        </Button>
      )}
    </div>
  );
};

export default TaskControls;
