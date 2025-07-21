import { NextRequest, NextResponse } from "next/server";
import { chromium, Browser, BrowserContext, Page, Response } from "playwright";
import querystring from 'querystring';

interface ExtractedParams {
  uk?: string;
  suk?: string;
  shareid?: string;
  sid?: string;
  fid?: string;
  sign?: string;
  timestamp?: string;
  jsToken?: string;
}

interface RequestBody {
  url: string;
}

interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RequestBody = await request.json();
    const { url } = body;
    
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    console.log('Processing URL:', url);
    console.time('Script Execution Time');

    const browser: Browser = await chromium.launch({
      headless: true,
      args: ['--disable-gpu', '--no-zygote', '--single-process', '--no-sandbox'],
    });

    const context: BrowserContext = await browser.newContext();
    const page: Page = await context.newPage();

    const cookies: Cookie[] = [
      { name: '__bid_n', value: '1909190d0d3a27f07a4207', domain: '.1024tera.com', path: '/' },
      { name: 'browserid', value: 'I1zxbS0QIV0zemsyHciFkkU2s7j9di8K82X4ltmCpCeEzZiJq-Ax2hCIZRs=', domain: '.1024tera.com', path: '/' },
      { name: 'csrfToken', value: 'SAzJwuP7ruv6L53pxMotbUVw', domain: 'www.1024tera.com', path: '/' },
      { name: 'lang', value: 'en', domain: '.1024tera.com', path: '/' },
      { name: 'ndut_fmt', value: 'D2FD0D336E0816EBD959EAD2C7A180FC303BB7F7E8B80C159E2951916A4FB5F1', domain: 'www.1024tera.com', path: '/' },
      { name: 'TSID', value: 'F9pUwGgiTYx29igabzOxbD1qVnn3CZVK', domain: '.1024tera.com', path: '/' },
      { name: 'BDUSS', value: 'YOUR_BDUSS_VALUE_HERE', domain: '.terabox.app', path: '/' },
      { name: 'STOKEN', value: 'YOUR_STOKEN_VALUE_HERE', domain: '.terabox.app', path: '/' },
    ];

    await context.addCookies(cookies);

    let capturedParams: ExtractedParams = {};

    page.on('response', async (response: Response) => {
      const responseUrl: string = response.url();
      
      if (responseUrl.includes('/share/streaming') || 
          responseUrl.includes('querysurltransfer') || 
          responseUrl.includes('jsToken') || 
          responseUrl.includes('membership/proxy/user')) {
        
        try {
          const body: string = await response.text();
          
          try {
            const json: any = JSON.parse(body);
            capturedParams = { ...capturedParams, ...json };
          } catch {
            // JSON parsing failed, continue with query params extraction
          }

          const queryParams: querystring.ParsedUrlQuery = querystring.parse(responseUrl.split('?')[1] || body);
          
          if (queryParams.jsToken && typeof queryParams.jsToken === 'string') {
            capturedParams.jsToken = queryParams.jsToken;
          }
          if (queryParams.sign && typeof queryParams.sign === 'string') {
            capturedParams.sign = queryParams.sign;
          }
          if (queryParams.timestamp && typeof queryParams.timestamp === 'string') {
            capturedParams.timestamp = queryParams.timestamp;
          }
          if (queryParams.uk && typeof queryParams.uk === 'string') {
            capturedParams.uk = queryParams.uk;
          }
          if (queryParams.shareid && typeof queryParams.shareid === 'string') {
            capturedParams.shareid = queryParams.shareid;
          }
          if (queryParams.fid && typeof queryParams.fid === 'string') {
            capturedParams.fid = queryParams.fid;
          }
          if (queryParams.sid && typeof queryParams.sid === 'string') {
            capturedParams.shareid = queryParams.sid;
          }
          if (queryParams.suk && typeof queryParams.suk === 'string') {
            capturedParams.uk = queryParams.suk;
          }
        } catch (error) {
          console.error('Error processing response:', error);
        }
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Try to click play button
    try {
      await page.click('button[class*="video-play-btn"]', { timeout: 5000 });
      await page.waitForTimeout(1000);
    } catch (error) {
      console.log(`Interaction error: ${(error as Error).message}`);
    }

    const htmlContent: string = await page.content();
    let searchContent: string = htmlContent;

    // Get script contents if needed
    if (!capturedParams.jsToken || !capturedParams.sign) {
      const scriptContents: string[] = await page.evaluate(() => {
        const scripts: NodeListOf<HTMLScriptElement> = document.querySelectorAll('script');
        return Array.from(scripts)
          .map((s: HTMLScriptElement) => s.textContent)
          .filter((t: string | null): t is string => 
            t !== null && (t.includes('uk') || t.includes('jsToken'))
          );
      });
      searchContent += scriptContents.join('\n');
    }

    // Extract parameters using regex
    const ukPattern: RegExp = /uk[=:"]?(\d+)"?|["']uk["']:["']?(\d+)["']?|fid=(\d+)|suk["']?:(\d+)/;
    const shareidPattern: RegExp = /shareid[=:"]?(\d+)"?|["']share_id["']:["']?(\d+)["']?|sid["']?:(\d+)/;
    const fidPattern: RegExp = /fid[=:"]?(\d+)"?|["']fid["']:["']?(\d+)["']?|fid=(\d+)/;
    const signPattern: RegExp = /sign[=:"]?([a-fA-F0-9%\-=]+?)(?:&|$|"|')|["']sign["']:["']?([a-fA-F0-9%\-=]+)["']?/;
    const timestampPattern: RegExp = /timestamp[=:"]?(\d+)"?|["']timestamp["']:["']?(\d+)["']?|time=(\d+)/;
    const jstokenPattern: RegExp = /jsToken[=:"]?([A-F0-9]+)"?|["']jsToken["']:["']?([A-F0-9]+)["']?|jsToken=([A-F0-9]+)/;

    const ukMatch: RegExpMatchArray | null = searchContent.match(ukPattern);
    const uk: string | null = capturedParams.uk || capturedParams.suk || 
      (ukMatch ? (ukMatch[1] || ukMatch[2] || ukMatch[3] || ukMatch[4]) : null);

    const shareidMatch: RegExpMatchArray | null = searchContent.match(shareidPattern);
    const shareid: string | null = capturedParams.shareid || capturedParams.sid || 
      (shareidMatch ? (shareidMatch[1] || shareidMatch[2] || shareidMatch[3]) : null);

    const fidMatch: RegExpMatchArray | null = searchContent.match(fidPattern);
    const fid: string | null = capturedParams.fid || 
      (fidMatch ? (fidMatch[1] || fidMatch[2] || fidMatch[3]) : null);

    const signMatch: RegExpMatchArray | null = searchContent.match(signPattern);
    const sign: string | null = capturedParams.sign || 
      (signMatch ? (signMatch[1] || signMatch[2]) : null);

    const timestampMatch: RegExpMatchArray | null = searchContent.match(timestampPattern);
    const timestamp: string | null = capturedParams.timestamp || 
      (timestampMatch ? (timestampMatch[1] || timestampMatch[2] || timestampMatch[3]) : null);

    const jstokenMatch: RegExpMatchArray | null = searchContent.match(jstokenPattern);
    const jstoken: string | null = capturedParams.jsToken || 
      (jstokenMatch ? (jstokenMatch[1] || jstokenMatch[2] || jstokenMatch[3]) : null);

    console.log(`\nExtracted Parameters:\nUK: ${uk}\nShareID: ${shareid}\nFID: ${fid}\nSign: ${sign}\nTimestamp: ${timestamp}\njsToken: ${jstoken}`);

    if (uk && shareid && fid && sign && timestamp && jstoken) {
      const streamingUrl: string = `https://www.1024tera.com/share/streaming?uk=${uk}&shareid=${shareid}&type=M3U8_FLV_264_480&fid=${fid}&sign=${sign}&timestamp=${timestamp}&jsToken=${jstoken}&esl=1&isplayer=1&ehps=1&clienttype=0&app_id=250528&web=1&channel=dubox&short_link=`;
      
      console.log('\nConstructed Streaming URL:\n', streamingUrl);
      
      await browser.close();
      console.timeEnd('Script Execution Time');
      
      return NextResponse.json({ streamUrl: streamingUrl }, {
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow all origins (adjust as needed)
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    } else {
      console.log('Some parameters missing. Cannot construct URL.');
      await browser.close();
      console.timeEnd('Script Execution Time');
      
      return NextResponse.json({ 
        error: "Could not extract required parameters from the Terabox link" 
      }, { status: 400 });
    }

  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    console.timeEnd('Script Execution Time');
    
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}