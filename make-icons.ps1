# 生成站点图标：assets/favicon-16/32/48/180/512.png 与 assets/favicon.ico
# 图形与 assets/favicon.svg 保持一致：蓝(#1668DC)→绿(#00B578) 渐变圆角方块 + 白色叶形 + 绿色叶脉
Add-Type -AssemblyName System.Drawing
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$assets = Join-Path $dir 'assets'
if (-not (Test-Path $assets)) { New-Item -ItemType Directory -Path $assets | Out-Null }

function New-IconBitmap([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap ($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  $S = [float]$size
  $radius = $S * 0.15625

  # 圆角渐变底
  $badge = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $radius * 2
  $badge.AddArc(0, 0, $d, $d, 180, 90)
  $badge.AddArc($S - $d, 0, $d, $d, 270, 90)
  $badge.AddArc($S - $d, $S - $d, $d, $d, 0, 90)
  $badge.AddArc(0, $S - $d, $d, $d, 90, 90)
  $badge.CloseFigure()
  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
    (New-Object System.Drawing.RectangleF(0, 0, $S, $S)),
    [System.Drawing.Color]::FromArgb(255, 22, 104, 220),
    [System.Drawing.Color]::FromArgb(255, 0, 181, 120),
    [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
  $g.FillPath($bgBrush, $badge)
  $bgBrush.Dispose(); $badge.Dispose()

  # 叶形轮廓（两段三次贝塞尔）
  $cx = $S * 0.5
  $leaf = New-Object System.Drawing.Drawing2D.GraphicsPath
  [void]$leaf.AddBezier($cx, $S * 0.156, $cx + $S * 0.273, $S * 0.289, $cx + $S * 0.242, $S * 0.672, $cx, $S * 0.859)
  [void]$leaf.AddBezier($cx, $S * 0.859, $cx - $S * 0.242, $S * 0.672, $cx - $S * 0.273, $S * 0.289, $cx, $S * 0.156)
  $leafBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
    (New-Object System.Drawing.RectangleF(0, 0, $S, $S)),
    [System.Drawing.Color]::FromArgb(255, 255, 255, 255),
    [System.Drawing.Color]::FromArgb(255, 214, 245, 231),
    [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
  $g.FillPath($leafBrush, $leaf)
  $leafBrush.Dispose(); $leaf.Dispose()

  # 中脉 + 侧脉（16px 下仍可辨认：只保留两对短侧脉）
  $penMain = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 2, 154, 103)), ($S * 0.038)
  $penMain.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $penMain.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLine($penMain, $cx, $S * 0.812, $cx, $S * 0.219)
  $penMain.Dispose()
  $penSide = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(210, 2, 154, 103)), ($S * 0.028)
  $penSide.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $penSide.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  foreach ($v in @(@(0.422, 0.352, 0.102), @(0.594, 0.520, 0.109))) {
    $y = $S * $v[0]
    $g.DrawLine($penSide, $cx, $y, $cx - $S * $v[2], $S * $v[1])
    $g.DrawLine($penSide, $cx, $y, $cx + $S * $v[2], $S * $v[1])
  }
  $penSide.Dispose()
  $g.Dispose()
  return $bmp
}

function Save-Png($bmp, $path, $size) {
  if ($bmp.Width -eq $size) { $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); return }
  $t = New-Object System.Drawing.Bitmap ($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($t)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($bmp, (New-Object System.Drawing.Rectangle(0, 0, $size, $size)))
  $g.Dispose()
  $t.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $t.Dispose()
}

# PNG 系列
$master = New-IconBitmap 512
foreach ($pair in @(@('favicon-512.png', 512), @('favicon-180.png', 180), @('favicon-48.png', 48), @('favicon-32.png', 32), @('favicon-16.png', 16))) {
  Save-Png $master (Join-Path $assets $pair[0]) $pair[1]
}
$master.Dispose()

# ICO（内嵌 16/32/48 三个尺寸，每个条目就是一枚完整 PNG）
$sizes = @(16, 32, 48)
$blobs = @()
foreach ($s in $sizes) {
  $b = New-IconBitmap $s
  $ms = New-Object System.IO.MemoryStream
  $b.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $blobs += , $ms.ToArray()
  $ms.Dispose(); $b.Dispose()
}
$out = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter $out
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $s = $sizes[$i]; $len = $blobs[$i].Length
  $bw.Write([Byte]($(if ($s -ge 256) { 0 } else { $s })))
  $bw.Write([Byte]($(if ($s -ge 256) { 0 } else { $s })))
  $bw.Write([Byte]0); $bw.Write([Byte]0)
  $bw.Write([UInt16]1); $bw.Write([UInt16]32)
  $bw.Write([UInt32]$len); $bw.Write([UInt32]$offset)
  $offset += $len
}
foreach ($bl in $blobs) { $bw.Write($bl) }
$bw.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $assets 'favicon.ico'), $out.ToArray())
$bw.Dispose(); $out.Dispose()

Get-ChildItem $assets -Filter 'favicon*' | Select-Object Name, Length | Format-Table -AutoSize
