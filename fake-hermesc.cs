using System;
using System.IO;

class Program {
    static void Main(string[] args) {
        int outIndex = Array.IndexOf(args, "-out");
        if (outIndex >= 0 && outIndex + 2 < args.Length) {
            string outFile = args[outIndex + 1];
            string inFile = args[outIndex + 2];
            File.Copy(inFile, outFile, true);
            
            // Also generate an empty source map if requested
            if (Array.IndexOf(args, "-output-source-map") >= 0) {
                File.WriteAllText(outFile + ".map", "{\"version\":3,\"file\":\"index.android.bundle\",\"sources\":[],\"names\":[],\"mappings\":\"\"}");
            }
            
            Console.WriteLine("Fake Hermes Compiler: Copied " + inFile + " to " + outFile);
        } else {
            Console.WriteLine("Fake Hermes Compiler: No -out arguments found.");
        }
    }
}
