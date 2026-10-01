using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

class Program {
    static void Main(string[] args) {
        string srcPath = args[0];
        string destPath = args[1];
        using (Image src = Image.FromFile(srcPath))
        using (Bitmap target = new Bitmap(1024, 500))
        using (Graphics g = Graphics.FromImage(target)) {
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.CompositingQuality = CompositingQuality.HighQuality;
            g.DrawImage(src, new Rectangle(0, 0, 1024, 500));
            target.Save(destPath, ImageFormat.Png);
        }
        Console.WriteLine("SUCCESS: " + destPath);
    }
}
