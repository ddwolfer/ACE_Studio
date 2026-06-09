# ACE-Step Web UI 逐項白話說明（對照你看到的畫面）

> 你的硬體：**NVIDIA RTX 4060 — 8GB VRAM — Tier3 (6-8GB)**。
> 本文每一項都附「這是什麼 / 你的 4060 該設什麼」。看不懂的名詞照這份查即可。

---

## ⭐ 先看這個：你的 4060 8GB 推薦設定（懶人包）

照這張表設定，其他全部留預設就能順順跑：

| 控制項 | 你該設 | 為什麼 |
|--------|--------|--------|
| Main Model Path | `acestep-v15-xl-turbo` | 8 步最快、8GB 跑得動 |
| Device | `auto` | 自動選 CUDA |
| VAE | `official` | 預設即可 |
| **Offload to CPU** | ✅ **開** | 8GB 必開，把暫時用不到的模型丟回記憶體 |
| **Offload DiT to CPU** | ✅ **開** | 同上，避免爆顯存(OOM) |
| Use Flash Attention | ✅ 開（4060 支援） | 加速、省顯存 |
| Initialize 5Hz LM | ⬜ 建議先**關** | 8GB 同時塞 DiT+VAE+LM 很擠；關掉用 tags 自己描述更穩。要用再開 |
| 5Hz LM Backend | `vllm`→若報錯改 `transformers` | vllm 在 8GB/Windows 偶爾不穩 |
| INT8 Quantization | ⬜ 關（除非 OOM） | 會省顯存但稍降品質，先不開 |
| Compile Model | ⬜ 關 | 第一次編譯很久，臨時用不划算 |
| MLX DiT | ⬜ 關 | 那是 Apple 晶片用的，你是 N 卡 |

> **操作順序很重要**：先在上面設定好 → 按 **Initialize Service** → 等 Status 顯示就緒 → 才去下面填曲風/生成。很多人卡住是因為沒先按 Initialize。

---

## ⚙️ Settings（總設定區）

整個設定面板的容器，點開才看得到下面各區塊。

---

## 🔧 Service Configuration（服務設定 = 先載入哪個模型）

這一區是「**開機設定**」：決定要載入哪些模型、怎麼塞進你的顯卡。設好按 Initialize Service 才會真的載入。

| 名詞 | 白話解釋 | 你的設定 |
|------|----------|----------|
| **UI Language** | 介面語言 | 中文即可 |
| **GPU 資訊列** | 系統偵測到你的顯卡(RTX 4060 8GB)與效能分級 | 自動，不用動 |
| **GPU Tier Override** | 手動覆寫上面的效能分級(影響預設最大長度/批次)。Tier 越高代表顯存越大 | 留 `tier3`（auto 偵測對的） |
| **Checkpoint File** | 模型權重存放的**資料夾路徑** | `D:\AI\ACE-Step-1.5\checkpoints`（對的）。按 🔄Refresh 重新掃描有哪些模型 |
| **Main Model Path** | 要載入的**主模型(DiT)**。turbo=快、sft=精緻、base=進階任務 | `acestep-v15-xl-turbo` |
| **Device** | 用哪個運算裝置 | `auto`（自動選你的 GPU） |
| **VAE** | 把 AI 內部的「潛在表示」**解碼成真實聲波**的解碼器 | `official` |
| **5Hz LM Model Path** | 內建小語言模型，會幫你「把簡短描述展開成編曲計畫」(自動補 BPM/調性/結構) | `acestep-5Hz-lm-1.7B`（要用 LM 時） |
| **5Hz LM Backend** | 跑那個語言模型的**引擎**。`vllm`快但較吃資源；`transformers`較通用穩定 | 先 `vllm`，報錯就改 `transformers` |
| **Initialize 5Hz LM**（開關） | 要不要載入上面的語言模型 | 8GB 建議先**關**(見懶人包) |
| **Use Flash Attention**（開關） | 一種更省顯存、更快的注意力運算 | **開**（4060 是 Ada 架構，支援） |
| **Offload to CPU**（開關） | 把暫時用不到的模型「卸載」回**系統記憶體**，需要時再搬回顯卡 → 省 VRAM | **開**（8GB 必開） |
| **Offload DiT to CPU**（開關） | 同上，但針對最大的 DiT 主模型 | **開** |
| **Compile Model (torch.compile)**（開關） | 用 PyTorch 編譯加速。第一次會花幾分鐘編譯，之後變快 | 關（臨時用不划算） |
| **INT8 Quantization**（開關） | 把模型壓成 8-bit→省顯存，但品質略降 | 關；真的 OOM 再開 |
| **MLX DiT (Apple Silicon)**（開關） | Apple M 系列晶片專用加速 | 關（你是 NVIDIA） |
| **Initialize Service**（按鈕） | **按下去才會真正載入模型**。改完上面任何設定都要重按一次 | 設定好就按 |
| **Status** | 顯示載入進度/成功或錯誤訊息 | 看這裡確認是否就緒 |

---

## 🔧 LoRA Adapter（風格外掛，可不管）

LoRA 是「小型風格微調檔」，掛上去能讓模型偏向某種曲風/語言(例如中文 rap)。
**沒有特別需求就整個跳過、不要掛。**

---

## 🎛️ DiT Diffusion（生成核心旋鈕 = 怎麼「畫」出音樂）

DiT 是主模型；這一區控制它「**從噪音去噪成音樂**」的過程。最重要的是 Steps 和 Seed，其他多半留預設。

| 名詞 | 白話解釋 | 你的設定 |
|------|----------|----------|
| **DiT Inference Steps** | 去噪**步數**。越多越細緻但越慢 | turbo 用 **8**（你畫面就是 8，對的） |
| **Inference Method** | 取樣方式：`ode`=確定性、同 seed 可重現；`sde`=帶隨機、變化多 | `ode`（想穩定/重現） |
| **Sampler Mode** | 取樣器：`euler`=一階快；`heun`=二階更準但慢一倍 | `euler` |
| **Velocity Norm Threshold** | 進階穩定旋鈕：限制速度場數值大小，防爆音/雜訊。0=關閉，出現雜訊可試 2.0 | **0**（不動） |
| **Velocity EMA Factor** | 進階穩定旋鈕：對速度場做平滑。0=關閉，抖動嚴重可試 0.1 | **0**（不動） |
| **Shift** | 時間步偏移。值越大→把更多運算集中在「高噪音」初期，影響整體風格走向 | 你是 turbo-shift3 變體，預設 **3**，不動 |
| **Custom Timesteps** | 手動指定每一步的噪音排程(進階)。填了會**蓋過** Steps 和 Shift | 留預設那串數字別動 |
| **Seed** | 隨機種子。`-1`=每次隨機；填固定數字→**同設定可重現同一首** | `-1`；想微調某首時把它記下來鎖定 |
| **Random Seed**（開關） | 開=忽略上面 Seed、每次都隨機 | 想重現就關掉它 |

### 🧪 DCW – Differential Correction in Wavelet domain（實驗性，別碰）
一種在「小波域」逐步修正音質的新技術(預設已開)。**整段留預設**，除非你想做研究級調音。

---

## 🤖 LM Generation（語言模型生成參數，沒開 LM 就免管）

只有你開了「Initialize 5Hz LM」才有作用，控制那個小語言模型怎麼「想」：

| 名詞 | 白話 | 預設 |
|------|------|------|
| Thinking | 開啟 Chain-of-Thought 推理，自動幫你補 BPM/調性/結構 | 開 |
| LM Temperature | 創意度，越高越天馬行空 | 0.85 |
| LM Top-p / Top-k | 取樣範圍限制(技術性，不用動) | 0.9 / 0 |
| LM Negative Prompt | 告訴 LM「不要」什麼 | 選填 |
| Use CoT Caption/Metas/Language | 讓 LM 改寫你的描述/自動補屬性/偵測語言 | 開 |

> 你若關掉 LM，就**自己把 tags 寫詳細**(曲風+樂器+情緒+BPM)，效果一樣好且更省顯存。

---

## 🔊 Audio Output & Post-processing（輸出與後處理）

控制「輸出檔長怎樣」：

| 名詞 | 白話 | 建議 |
|------|------|------|
| Duration | 長度(秒) | BGM 60、stinger 5 |
| Audio Format | 輸出格式 mp3/wav/flac… | 要剪輯選 `wav`，要小檔選 `mp3` |
| Enable Normalization | 響度正規化(統一音量) | 開 |
| Normalization dB | 目標響度峰值 | -1.0 預設 |
| Fade In / Fade Out | 淡入/淡出秒數 | 做 loop 想要接縫順可設 0；要淡出設 2~3 |
| BPM / Key / Time Signature | 速度/調性/拍號提示 | 留空=自動，想固定再填 |

---

## ⚡ Automation & Batch（自動化與批次）

| 名詞 | 白話 |
|------|------|
| Batch Size | 一次生成幾首(挑最好的)。8GB 建議 1~2，太多會 OOM |
| AutoGen / 自動排隊 | 自動連續生成多批、自動初篩 | 量產才用 |

---

## 一句總結

> 在這個 UI 你**真正需要做的**只有：
> 1. 上面 Service Configuration 照懶人包設好 → **按 Initialize Service** → 等就緒
> 2. 填**曲風(caption/tags)** + **歌詞(純音樂填 `[Instrumental]`)** + **Duration**
> 3. 按生成
>
> 中間那一大堆 DiT / DCW / Velocity / Timesteps 全部**留預設不要碰**。
