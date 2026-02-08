
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingSource, TimeRange, EditorialCategory, BriefCategory, MonitorResult, EditorialItem, MonitorEntity, MonitorResponse } from "../types";

function getApiKey(): string {
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key || key === 'undefined' || key === 'your_api_key_here') {
    throw new Error(
      'מפתח API של Gemini לא הוגדר. ' +
      'יש ליצור קובץ .env.local בתיקיית הפרויקט עם השורה:\n' +
      'GEMINI_API_KEY=your-actual-api-key\n' +
      'ניתן להשיג מפתח בכתובת: https://makersuite.google.com/app/apikey'
    );
  }
  return key;
}

let _ai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: getApiKey() });
  }
  return _ai;
}

export function formatGeminiError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('API key') || msg.includes('מפתח API')) return msg;
  if (msg.includes('401') || msg.includes('UNAUTHENTICATED')) return 'מפתח ה-API אינו תקף. יש לבדוק שהמפתח נכון ופעיל.';
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) return 'אין הרשאה. יש לוודא שה-API מופעל בפרויקט Google Cloud.';
  if (msg.includes('404') || msg.includes('NOT_FOUND')) return 'המודל לא נמצא. ייתכן ששם המודל שגוי או שאין גישה אליו.';
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) return 'חריגה ממכסת השימוש. יש לנסות שוב מאוחר יותר.';
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) return 'שגיאת רשת. יש לבדוק את החיבור לאינטרנט.';
  return `שגיאה בתקשורת עם Gemini: ${msg}`;
}

/**
 * Generates specific list based on category.
 */
export const generateEditorialMeeting = async (
  timeRange: TimeRange, 
  category: EditorialCategory, 
  isDeepScan: boolean = false
): Promise<{ items: EditorialItem[]; sources: GroundingSource[] }> => {
  try {
    // 1. Define Time Text Logic
    let timeText = "";
    switch (timeRange) {
      case '24h_window':
      case '24h':
        timeText = "ב-72 השעות האחרונות (אתמול, היום ושלשום)";
        break;
      case 'week_window':
        timeText = "השבוע האחרון והשבוע הקרוב (מבט שבועי אחורה וקדימה)";
        break;
      case 'month':
        timeText = "ב-28 הימים האחרונים";
        break;
      case 'current_month':
        timeText = "בחודש הקלנדרי הנוכחי (מתחילת החודש ועד היום)";
        break;
      case '12h':
        timeText = "ב-12 השעות האחרונות";
        break;
      case '48h':
        timeText = "ב-48 השעות האחרונות";
        break;
      case '72h':
        timeText = "ב-3 הימים האחרונים";
        break;
      default:
        timeText = "בזמן האחרון";
    }

    const volumeInstruction = isDeepScan 
      ? `
      הנחיית סריקה מורחבת (Deep Scan):
      אל תסתפק בתוצאות הראשונות. המטרה היא להביא רשימה מלאה ומקיפה ככל הניתן.
      נסה להגיע ללפחות 40-50 תוצאות אם קיימות.
      בצע מספר שאילתות חיפוש פנימיות כדי לכסות דפים שונים ותתי-קטגוריות במאגר.
      אל תשאיר פריטים משמעותיים בחוץ.
      `
      : `נסה להביא לפחות 15-20 תוצאות איכותיות.`;

    // Common instruction for JSON formatting
    const jsonInstruction = `
    הנחיות קריטיות לפורמט (חובה):
    החזר את התשובה אך ורק כרשימה בפורמט **JSON Array** תקין.
    אל תוסיף Markdown (כמו \`\`\`json), אל תוסיף הקדמות ואל תוסיף הערות.

    מבנה כל אובייקט ב-JSON:
    {
      "date": "תאריך הרשומה (או טווח תאריכים)",
      "title": "הנושא הראשי / כותרת",
      "description": "פירוט, תקציר, סטטוס או הערות חשובות",
      "meta": "מידע מטא: מספר החלטה, שם יוזם, מיקום, מס' הליך וכד'",
      "link": "קישור ישיר למקור (אם יש)"
    }
    אם שדה לא רלוונטי, השאר מחרוזת ריקה.
    `;

    let prompt = "";

    switch (category) {
      case 'government_decisions':
        prompt = `
          המשימה: יצירת רשימה של **החלטות ממשלה** שאושרו.
          טווח זמן: ${timeText}.
          מקורות: אתר משרד רה"מ (מדיניות), אתר השירותים הממשלתי.
          ${volumeInstruction}
          ${jsonInstruction}
          מיפוי שדות: date: תאריך אישור, title: נושא ההחלטה, description: תמצית ההחלטה, meta: מספר החלטה
        `;
        break;

      case 'government_agenda':
        prompt = `
          המשימה: איתור מסמכי סדר יום הממשלה והחלטות ממשלה מהשבוע האחרון (כולל הצעות החלטה, טיוטות חוק ומינויים).
          במקום לנסות לגשת ל-URL ספציפי שנכשל בסריקה, בצע חיפוש Google ממוקד לאיתור הקבצים עצמם:
          1. site:gov.il "סדר יום לישיבת הממשלה"
          2. site:gov.il "הצעת החלטה" filetype:pdf
          3. site:gov.il "טיוטת חוק" filetype:pdf
          ${volumeInstruction}
          ${jsonInstruction}
          מיפוי שדות: date: תאריך, title: שם הקובץ, description: תיאור קצר, meta: סוג, link: הקישור למסמך (חובה!)
        `;
        break;

      case 'legislation_tazkirim':
        prompt = `
          המשימה: איתור **תזכירי חוק ממשלתיים** הפתוחים להערות הציבור.
          ${volumeInstruction}
          ${jsonInstruction}
          מיפוי שדות: date: תאריך אחרון להערות, title: שם התזכיר, description: תיאור קצר, meta: משרד יוזם
        `;
        break;

      case 'legislation_knesset':
        prompt = `
          המשימה: איתור הצעות חוק חדשות ב**מאגר החקיקה הלאומי** (אתר הכנסת).
          טווח זמן: ${timeText}.
          ${volumeInstruction}
          ${jsonInstruction}
          מיפוי שדות: date: תאריך עדכון, title: שם הצעת החוק, description: סטטוס, meta: ח"כ יוזם
        `;
        break;

      case 'knesset_agenda':
        prompt = `
          המשימה: לו"ז ועדות הכנסת ומליאה.
          טווח זמן: ${timeText}.
          ${volumeInstruction}
          ${jsonInstruction}
          מיפוי שדות: date: תאריך ושעה, title: שם הוועדה, description: נושא הדיון, meta: מיקום
        `;
        break;

      case 'courts':
        prompt = `
          המשימה: יומן דיונים בבית המשפט העליון (בג"ץ) בנושאים ציבוריים/חוקתיים.
          טווח זמן: ${timeText}.
          ${volumeInstruction}
          ${jsonInstruction}
          מיפוי שדות: date: תאריך ושעה, title: צדדים/נושא, description: הערות, meta: הרכב שופטים
        `;
        break;
      
      case 'planning':
        prompt = `
          המשימה: איתור הודעות על **הפקדת תוכניות מתאר**.
          חפש באתר iplan.gov.il ובאתר משרד הפנים.
          ${volumeInstruction}
          ${jsonInstruction}
          מיפוי שדות: date: תאריך, title: שם התוכנית, description: מהות, meta: סטטוס/מספר
        `;
        break;

      case 'procurement':
        prompt = `
          המשימה: איתור מכרזים ממשלתיים חדשים ובקשות לפטור ממכרז.
          מקור: mr.gov.il.
          ${volumeInstruction}
          ${jsonInstruction}
          מיפוי שדות: date: תאריך פרסום, title: נושא ההתקשרות, description: סוג (מכרז/פטור), meta: המשרד המפרסם
        `;
        break;
    }

    const response = await getClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 32768 } 
      }
    });

    const rawText = response.text || "[]";
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let items: EditorialItem[] = [];
    try {
      items = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse JSON:", cleanJson);
      items = [];
    }

    const sources = extractSources(response);
    return { items, sources };

  } catch (error) {
    console.error("Error generating list:", error);
    throw error;
  }
};

/**
 * Monitors specific topics with structured Card output and executive summary.
 */
export const monitorTopics = async (topics: string[], entities: MonitorEntity[], timeRange: TimeRange): Promise<MonitorResponse> => {
  try {
    let timeText = "";
    switch (timeRange) {
      case '24h_window': timeText = "ב-72 השעות האחרונות (אתמול, היום ושלשום)"; break;
      case 'week_window': timeText = "השבוע שעבר והשבוע הקרוב (Progressive View)"; break;
      case 'current_month': timeText = "החודש הקלנדרי הנוכחי"; break;
      default: timeText = "בשבוע האחרון";
    }

    const entitiesText = entities.map(e => {
       const siteQuery = e.url ? `site:${new URL(e.url).hostname}` : '';
       return `${e.name} ${siteQuery ? `(${siteQuery})` : ''}`;
    }).join(', ');

    const prompt = `
      אתה תחקירן בכיר המבצע סריקת מודיעין עמוקה (Due Diligence).
      מילות מפתח: ${topics.join(', ')}.
      גופים: ${entitiesText}.
      טווח זמן: ${timeText}.

      הנחיה טכנית קריטית:
      החזר JSON בלבד:
      {
        "executiveSummary": ["תובנה 1", "תובנה 2"],
        "results": [{"title": "", "source": "", "url": "", "date": "", "relevanceScore": 10, "relevanceReason": "", "summary": ""}]
      }
    `;

    const response = await getClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    const rawText = response.text || "{}";
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const data = JSON.parse(cleanJson);
      return {
        executiveSummary: data.executiveSummary || [],
        results: data.results || []
      };
    } catch (parseError) {
      console.error("Failed to parse JSON:", rawText);
      return { executiveSummary: [], results: [] };
    }
  } catch (error) {
    console.error("Error monitoring topics:", error);
    throw error;
  }
};

export const generateDailyBrief = async (categories: BriefCategory[], timeRange: TimeRange): Promise<{ text: string; sources: GroundingSource[] }> => {
  try {
    let timeText = "";
    switch (timeRange) {
      case '12h': timeText = "ב-12 השעות האחרונות"; break;
      case '24h': timeText = "ביממה האחרונה"; break;
      case '48h': timeText = "ביומיים האחרונים"; break;
      case '72h': timeText = "ב-3 הימים האחרונים"; break;
      default: timeText = "ביממה האחרונה";
    }

    const prompt = `דו"ח מודיעין יומי. נושאים: ${categories.join(', ')}. זמן: ${timeText}.`;

    const response = await getClient().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    const sources = extractSources(response);
    return { text, sources };
  } catch (error) {
    console.error("Error generating brief:", error);
    throw error;
  }
};

export const generateConsolidatedReport = async (items: string[]): Promise<string> => {
  try {
    const context = items.join("\n\n-----------------\n\n");
    const prompt = `פעל כעורך ראשי. הכן סיכום "ישיבת מערכת" מהממצאים: ${context}`;
    const response = await getClient().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 16384 } }
    });
    return response.text || "לא ניתן לייצר סיכום.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "שגיאה בייצור הסיכום.";
  }
};

export const processTextWithGemini = async (text: string, task: 'proofread' | 'summarize' | 'headlines' | 'quotes' | 'to_news'): Promise<string> => {
  const prompt = `משימה: ${task}. טקסט: ${text}`;
  try {
    const response = await getClient().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Processing error:", error);
    return "אירעה שגיאה.";
  }
}

export const editImage = async (imageDataUrl: string, prompt: string): Promise<string> => { return ""; };

function extractSources(response: GenerateContentResponse): GroundingSource[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources: GroundingSource[] = [];
  chunks.forEach((chunk: any) => {
    if (chunk.web) {
      sources.push({
        title: chunk.web.title || "מקור רשת",
        uri: chunk.web.uri || "#"
      });
    }
  });
  return Array.from(new Map(sources.map(s => [s.uri, s])).values());
}
