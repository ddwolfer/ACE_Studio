# ComfyUI workflow 載入說明

完整節點教學見上層 [`../COMFYUI-GUIDE.md`](../COMFYUI-GUIDE.md)。

## 最快取得可用 workflow 的方法

ACE-Step 1.5 / XL 的 workflow JSON 隨 ComfyUI 與官方範本更新很快，**建議直接用官方範本**避免版本不相容：

1. 開 ComfyUI → 選單 **Workflow → Browse Templates → Audio**
2. 選 **ACE-Step 1.5 XL Turbo: Text to Music**（或 Base）
3. 載入後依 `../COMFYUI-GUIDE.md` 對照每個節點調參數

或從這些頁面「Download / Open in ComfyUI」：
- XL Turbo: https://comfy.org/workflows/audio_ace_step1_5_xl_turbo-9851c174a194/
- XL Base:  https://www.comfy.org/workflows/audio_ace_step1_5_xl_base-536dc32faee1/
- 1.5 split: https://www.comfy.org/workflows/audio_ace_step_1_5_split-f93775fd8ce0/

## 載入後要做的事
1. `CheckpointLoader` 選你下載的權重（缺檔節點會變紅，照提示去 HF 下載）。
2. `EmptyAceStepLatentAudio.seconds` 設長度（BGM 60、stinger 4）。
3. `TextEncodeAceStepAudio.tags` 貼 `../prompts/` 裡的範例；lyrics 填 `[instrumental]`。
4. `KSampler`：turbo → steps=8、cfg=1；sft → steps=50、cfg=3–7。
5. Queue Prompt，輸出在 `ComfyUI/output/audio/`。

> 把你調好的 workflow 用 ComfyUI 的「Save」匯出 JSON 放這個資料夾，下次直接拖進視窗即可。
