"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Moon, Sun, Download, Share2, ArrowUpRight, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import JsBarcode from "jsbarcode";

type Receipt = {
  topLanguages: string;
  date: string;
  time: string;
  order: number;
  authCode: number;
  cardNumber: string;
  mostActiveDay: string;
  commits30d: number;
  starsEarned: number;
  repoForks: number;
  profileScore: number;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  name: string;
  login: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function GitHubReceipts() {
  const [username, setUsername] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);

  const generateReceipt = async () => {
    if (!username.trim()) {
      setError("Please enter a GitHub username");
      return;
    }

    setLoading(true);
    setError(null);
    setReceipt(null);

    try {
      const res = await fetch(`/api/github/${encodeURIComponent(username.trim())}`);

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 404) {
          setError(`User "${username}" not found on GitHub`);
        } else if (res.status === 403) {
          setError("Rate limit exceeded. Please try again later or add a GITHUB_TOKEN to .env.local");
        } else {
          setError(data.error || "Failed to fetch GitHub data");
        }
        return;
      }

      const data = await res.json();
      const currentDate = new Date();

      const newReceipt: Receipt = {
        ...data,
        date: currentDate
          .toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
          .toUpperCase(),
        time: currentDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
        order: Math.floor(Math.random() * 90000) + 10000,
        authCode: Math.floor(Math.random() * 900000) + 100000,
        cardNumber:
          "**** **** **** " +
          Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0"),
        mostActiveDay: DAYS[Math.floor(Math.random() * 7)],
      };

      setReceipt(newReceipt);

      // Generate barcode after setting receipt
      setTimeout(() => {
        if (barcodeRef.current) {
          JsBarcode(barcodeRef.current, `https://github.com/${data.login}`, {
            format: "CODE128",
            width: 1,
            height: 30,
            displayValue: false,
          });
        }
      }, 0);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async () => {
    if (receiptRef.current) {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `github-receipt-${username}.png`;
      link.click();
    }
  };

  const shareReceipt = async () => {
    if (receiptRef.current) {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.share({
              files: [new File([blob], "receipt.png", { type: "image/png" })],
              title: "GitHub Receipt",
              text: "Check out my GitHub Receipt!",
            });
          } catch {
            // Share cancelled or not supported
          }
        }
      });
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className={`min-h-[calc(100svh-185px)] ${isDark ? "dark" : ""}`}>
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <a
              href="https://github.com/aakashsharma7/github-receipt"
              target="_blank"
              rel="norefferer noopener"
              className="hover:underline"
            >
              GitHub Repo
              <ArrowUpRight className="size-3 inline" />
            </a>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">GitHub Receipt</h1>
          <p className="text-muted-foreground">
            Generate a receipt-style summary of your GitHub profile
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Enter GitHub username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateReceipt()}
            disabled={loading}
          />
          <Button onClick={generateReceipt} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {receipt && (
          <>
            <div
              ref={receiptRef}
              className="bg-white text-black p-8 rounded-lg shadow-lg font-mono relative overflow-hidden w-[350px] mx-auto"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0,0,0,0.015) 2px,
                    rgba(0,0,0,0.015) 4px
                  ),
                  repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 2px,
                    rgba(0,0,0,0.01) 2px,
                    rgba(0,0,0,0.01) 4px
                  )
                `,
                backgroundColor: "#fefefe",
              }}
            >
              {/* Top tear */}
              <div className="tear top-0"></div>

              <div className="space-y-6 pt-4">
                <div className="text-center">
                  <h2 className="text-xl font-bold">GITHUB RECEIPT</h2>
                  <p className="text-sm">{receipt.date}</p>
                  <p className="text-sm">ORDER #{receipt.order}</p>
                </div>

                <div className="space-y-1">
                  <p>CUSTOMER: {receipt.name}</p>
                  <p>@{receipt.login}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>REPOSITORIES</span>
                    <span>{receipt.public_repos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>STARS EARNED</span>
                    <span>{receipt.starsEarned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>REPO FORKS</span>
                    <span>{receipt.repoForks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FOLLOWERS</span>
                    <span>{receipt.followers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FOLLOWING</span>
                    <span>{receipt.following}</span>
                  </div>
                </div>

                <div className="space-y-1 border-t border-dashed pt-4">
                  <p>TOP LANGUAGES:</p>
                  <p>{receipt.topLanguages}</p>
                </div>

                <div className="space-y-1 border-t border-dashed pt-4">
                  <div className="flex justify-between">
                    <span>MOST ACTIVE DAY:</span>
                    <span>{receipt.mostActiveDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>COMMITS (30d):</span>
                    <span>{receipt.commits30d}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>PROFILE SCORE:</span>
                    <span>{receipt.profileScore}</span>
                  </div>
                </div>

                <div className="text-center space-y-1 text-sm">
                  <p>Served by: gitreceipt</p>
                  <p>{receipt.time}</p>
                </div>

                <div className="space-y-1 border-t border-dashed pt-4 text-center">
                  <p>COUPON CODE: DJMOU7</p>
                  <p className="text-sm">Save for your next commit!</p>
                </div>

                <div className="space-y-1 text-sm">
                  <p>CARD #: {receipt.cardNumber}</p>
                  <p>AUTH CODE: {receipt.authCode}</p>
                  <p>CARDHOLDER: {receipt.login.toUpperCase()}</p>
                </div>

                <div className="text-center pt-4">
                  <p>THANK YOU FOR CODING!</p>
                </div>

                <div className="pt-4 text-center flex flex-col justify-center items-center">
                  <svg ref={barcodeRef} className="w-full"></svg>
                  <p className="text-xs pt-1">github.com/{receipt.login}</p>
                </div>
              </div>

              {/* Bottom tear */}
              <div className="tear bottom-0"></div>
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={downloadReceipt} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={shareReceipt} variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
