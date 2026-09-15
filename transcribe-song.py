import sys,json,os
sys.path.insert(0,'.audio-tools')
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING']='1'
from faster_whisper import WhisperModel
model=WhisperModel('base.en',device='cpu',compute_type='int8',download_root='.audio-models')
segments,info=model.transcribe('invaders-theme.mp3',word_timestamps=True,beam_size=5,vad_filter=False)
result=[]
for s in segments:
    row={'start':s.start,'end':s.end,'text':s.text,'words':[{'start':w.start,'end':w.end,'word':w.word} for w in s.words]}
    result.append(row)
    print(json.dumps(row),flush=True)
open('song-timings.json','w').write(json.dumps(result,indent=2))
