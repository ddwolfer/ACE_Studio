"""裁掉音檔頭尾靜音，輸出 loop-ready 檔。用引擎 venv 的 python 跑（有 soundfile/numpy）。
用法: python trim_silence.py <in.wav> [threshold]
成功時把輸出路徑印到 stdout。"""
import os
import sys


def main() -> None:
    src = sys.argv[1]
    thresh = float(sys.argv[2]) if len(sys.argv) > 2 else 0.006

    import numpy as np

    try:
        import soundfile as sf

        data, sr = sf.read(src, always_2d=True)  # float32, shape (n, ch)

        def write(path, arr):
            sf.write(path, arr, sr)
    except Exception:
        # 後備：stdlib wave（僅支援 16-bit PCM）
        import wave

        with wave.open(src, "rb") as w:
            sr = w.getframerate()
            ch = w.getnchannels()
            raw = w.readframes(w.getnframes())
            sampwidth = w.getsampwidth()
        if sampwidth != 2:
            print(src)  # 不支援的格式，原樣返回
            return
        data = (np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0).reshape(-1, ch)

        def write(path, arr):
            import wave as _w

            with _w.open(path, "wb") as o:
                o.setnchannels(arr.shape[1])
                o.setsampwidth(2)
                o.setframerate(sr)
                o.writeframes((np.clip(arr, -1, 1) * 32767).astype(np.int16).tobytes())

    amp = np.max(np.abs(data), axis=1)
    above = np.where(amp > thresh)[0]
    if len(above) == 0:
        print(src)
        return

    pad = int(0.03 * sr)  # 留 30ms 微緩衝
    s = max(0, int(above[0]) - pad)
    e = min(len(data), int(above[-1]) + pad + 1)
    trimmed = data[s:e]

    base, _ = os.path.splitext(src)
    out = base + "_loop.wav"
    write(out, trimmed)
    print(out)


if __name__ == "__main__":
    main()
