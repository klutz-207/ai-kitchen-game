param(
  [string[]]$Paths
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing
$drawingCommon = Join-Path ([System.Runtime.InteropServices.RuntimeEnvironment]::GetRuntimeDirectory()) "System.Drawing.Common.dll"
if (-not (Test-Path -LiteralPath $drawingCommon)) {
  $drawingCommon = "C:\Program Files\dotnet\shared\Microsoft.WindowsDesktop.App\7.0.20\System.Drawing.Common.dll"
}
$gdiPlus = Join-Path ([System.Runtime.InteropServices.RuntimeEnvironment]::GetRuntimeDirectory()) "System.Private.Windows.GdiPlus.dll"
$windowsCore = Join-Path ([System.Runtime.InteropServices.RuntimeEnvironment]::GetRuntimeDirectory()) "System.Private.Windows.Core.dll"
$drawingPrimitives = Join-Path ([System.Runtime.InteropServices.RuntimeEnvironment]::GetRuntimeDirectory()) "System.Drawing.Primitives.dll"

$source = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class ChefFringeCleaner
{
    private static bool IsLightNeutral(int r, int g, int b)
    {
        int max = Math.Max(r, Math.Max(g, b));
        int min = Math.Min(r, Math.Min(g, b));
        return max >= 232 && (max - min) <= 42;
    }

    private static bool TouchesTransparent(int[] pixels, int w, int h, int x, int y)
    {
        for (int yy = Math.Max(0, y - 2); yy <= Math.Min(h - 1, y + 2); yy++)
        {
            for (int xx = Math.Max(0, x - 2); xx <= Math.Min(w - 1, x + 2); xx++)
            {
                if (((pixels[yy * w + xx] >> 24) & 255) < 10)
                {
                    return true;
                }
            }
        }
        return false;
    }

    private static bool FindNeighborColor(int[] src, int w, int h, int x, int y, out int rr, out int gg, out int bb)
    {
        rr = gg = bb = 0;
        int count = 0;
        for (int radius = 1; radius <= 5 && count == 0; radius++)
        {
            for (int yy = Math.Max(0, y - radius); yy <= Math.Min(h - 1, y + radius); yy++)
            {
                for (int xx = Math.Max(0, x - radius); xx <= Math.Min(w - 1, x + radius); xx++)
                {
                    if (Math.Abs(xx - x) != radius && Math.Abs(yy - y) != radius) continue;
                    int p = src[yy * w + xx];
                    int a = (p >> 24) & 255;
                    if (a < 210) continue;
                    int r = (p >> 16) & 255;
                    int g = (p >> 8) & 255;
                    int b = p & 255;
                    int max = Math.Max(r, Math.Max(g, b));
                    int min = Math.Min(r, Math.Min(g, b));
                    if (max >= 244 && (max - min) <= 24) continue;
                    rr += r;
                    gg += g;
                    bb += b;
                    count++;
                }
            }
        }
        if (count == 0) return false;
        rr /= count;
        gg /= count;
        bb /= count;
        return true;
    }

    public static void Clean(string input, string output)
    {
        using (Bitmap original = new Bitmap(input))
        using (Bitmap bmp = new Bitmap(original.Width, original.Height, PixelFormat.Format32bppArgb))
        {
            using (Graphics g = Graphics.FromImage(bmp))
            {
                g.DrawImageUnscaled(original, 0, 0);
            }

            int w = bmp.Width;
            int h = bmp.Height;
            Rectangle rect = new Rectangle(0, 0, w, h);
            BitmapData data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            int[] src = new int[w * h];
            Marshal.Copy(data.Scan0, src, 0, src.Length);
            int[] dst = (int[])src.Clone();

            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    int i = y * w + x;
                    int p = src[i];
                    int a = (p >> 24) & 255;
                    if (a == 0) continue;
                    int r = (p >> 16) & 255;
                    int g = (p >> 8) & 255;
                    int b = p & 255;

                    bool edge = TouchesTransparent(src, w, h, x, y);
                    if (!edge) continue;

                    if (a <= 110 && IsLightNeutral(r, g, b))
                    {
                        dst[i] = 0;
                        continue;
                    }

                    if (a < 235 && IsLightNeutral(r, g, b))
                    {
                        int nr, ng, nb;
                        if (FindNeighborColor(src, w, h, x, y, out nr, out ng, out nb))
                        {
                            r = (r + nr * 3) / 4;
                            g = (g + ng * 3) / 4;
                            b = (b + nb * 3) / 4;
                        }
                        a = Math.Max(0, Math.Min(255, (int)(a * 0.82)));
                        dst[i] = (a << 24) | (r << 16) | (g << 8) | b;
                    }
                }
            }

            Marshal.Copy(dst, 0, data.Scan0, dst.Length);
            bmp.UnlockBits(data);

            Directory.CreateDirectory(Path.GetDirectoryName(output));
            bmp.Save(output, ImageFormat.Png);
        }
    }
}
"@

Add-Type -TypeDefinition $source -ReferencedAssemblies @("System.Drawing", $drawingCommon, $drawingPrimitives, $gdiPlus, $windowsCore)

foreach ($path in $Paths) {
  $resolved = Resolve-Path -LiteralPath $path
  $tempPath = "$($resolved.Path).cleaning.tmp.png"
  [ChefFringeCleaner]::Clean($resolved.Path, $tempPath)
  Move-Item -LiteralPath $tempPath -Destination $resolved.Path -Force
  Write-Host "Cleaned $($resolved.Path)"
}
