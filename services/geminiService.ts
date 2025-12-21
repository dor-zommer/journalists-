import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingSource, TimeRange, EditorialCategory, BriefCategory, MonitorResult, EditorialItem, MonitorEntity, MonitorResponse } from "../types";

let cachedClient: GoogleGenAI | null = null;

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Gemini API key. Set GEMINI_API_KEY in your .env.local file.");
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
};

/**
 * Generates specific list based on category.
 */
export const generateEditorialMeeting = async (timeRange: TimeRange, category: EditorialCategory): Promise<{ items: EditorialItem[]; sources: GroundingSource[] }> => {
  try {
    const ai = getClient();
    // 1. Define Time Text Logic
    let timeText = "";
    switch (timeRange) {
      case '24h_window':
      case '24h':
        // Updated to 72 hours as requested
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
      // --- ממשלה ---
      case 'government_decisions':
        prompt = `
          המשימה: יצירת רשימה של **החלטות ממשלה** שאושרו.
          טווח זמן: ${timeText}.
          מקורות: אתר משרד רה"מ (מדיניות), אתר השירותים הממשלתי.
          
          ${jsonInstruction}
          
          מיפוי שדות:
          date: תאריך אישור
          title: נושא ההחלטה
          description: תמצית ההחלטה
          meta: מספר החלטה
        `;
        break;

      case 'government_agenda':
        prompt = `
          המשימה: איתור מסמכי סדר יום הממשלה והחלטות ממשלה מהשבוע האחרון (כולל הצעות החלטה, טיוטות חוק ומינויים).
          
          במקום לנסות לגשת ל-URL ספציפי שנכשל בסריקה, בצע חיפוש Google ממוקד לאיתור הקבצים עצמם:
          1. חפש: site:gov.il "סדר יום לישיבת הממשלה" (מהשבוע האחרון).
          2. חפש: site:gov.il "הצעת החלטה" filetype:pdf (מהשבוע האחרון).
          3. חפש: site:gov.il "טיוטת חוק" filetype:pdf (מהשבוע האחרון).
          4. חפש: site:gov.il "מינוי" filetype:pdf (מהשבוע האחרון).

          הנחיות קריטיות:
          1. **אסוף את כל הפריטים** שתמצא מהשבוע האחרון (נסה להגיע ל-12-15 פריטים לפחות). אל תעצור אחרי 3.
          2. לכל פריט, חלץ את הקישור הישיר לקובץ (PDF) מתוצאות החיפוש.
          3. התעלם משגיאות גישה ל"דף האוסף" - השתמש בתוצאות החיפוש הישירות של גוגל כמקור האמת.
          
          ${jsonInstruction}
          
          מיפוי שדות:
          date: התאריך המופיע בתוצאה
          title: שם הקובץ / הכותרת (למשל: "טיוטת חוק...", "מינוי שגריר...")
          description: תיאור קצר מאוד
          meta: סוג (סדר יום / החלטה / מינוי)
          link: הקישור למסמך (חובה!)
        `;
        break;

      // --- חקיקה ---
      case 'legislation_tazkirim':
        prompt = `
          המשימה: איתור **תזכירי חוק ממשלתיים** הפתוחים כרגע להערות הציבור באתר "תזכירים".
          פוקוס: הבא את הרשימה המלאה ביותר שאתה מוצא.
          
          ${jsonInstruction}
          
          מיפוי שדות:
          date: תאריך אחרון להערות
          title: שם התזכיר
          description: תיאור קצר
          meta: משרד יוזם
          מיין לפי תאריך סגירה.
        `;
        break;

      case 'legislation_knesset':
        prompt = `
          המשימה: איתור הצעות חוק חדשות ב**מאגר החקיקה הלאומי** (אתר הכנסת).
          טווח זמן: ${timeText}.
          חפש הצעות חוק שהונחו על שולחן הכנסת או עברו קריאה טרומית/ראשונה לאחרונה.
          
          ${jsonInstruction}
          
          מיפוי שדות:
          date: תאריך עדכון אחרון
          title: שם הצעת החוק
          description: סטטוס (הונחה, טרומית וכו')
          meta: ח"כ יוזם / משרד יוזם
        `;
        break;

      // --- כנסת ---
      case 'knesset_agenda':
        prompt = `
          המשימה: לו"ז ועדות הכנסת ומליאה.
          טווח זמן: ${timeText}.
          
          ${jsonInstruction}
          
          מיפוי שדות:
          date: תאריך ושעה
          title: שם הוועדה
          description: נושא הדיון
          meta: מיקום / הערות
        `;
        break;

      // --- משפט ---
      case 'courts':
        prompt = `
          המשימה: יומן דיונים בבית המשפט העליון (בג"ץ) בנושאים ציבוריים/חוקתיים.
          טווח זמן: ${timeText}.
          חפש ב"יומן דיונים" באתר הרשות השופטת או בסיקורים משפטיים על דיונים צפויים.
          
          ${jsonInstruction}
          
          מיפוי שדות:
          date: תאריך ושעה
          title: הצדדים / הנושא המשפטי
          description: הערות ותקציר
          meta: הרכב שופטים
        `;
        break;
      
      // --- תכנון ובנייה (משודרג) ---
      case 'planning':
        prompt = `
          המשימה: איתור כמות גדולה של הודעות על **הפקדת תוכניות מתאר** (תב"ע/תמ"א).
          
          השתמש בחיפוש ממוקד כדי להביא רשימה ארוכה של תוכניות (לפחות 15-20):
          1. חפש: site:mavat.iplan.gov.il "הוראות התוכנית" (מהחודש האחרון)
          2. חפש: site:gov.il "הודעה בדבר הפקדת תוכנית" (מהחודש האחרון)
          3. חפש: "הפקדת תוכנית" AND ("מחוז ירושלים" OR "מחוז תל אביב" OR "מחוז מרכז")
          
          **חובה**: אל תסתפק בתוצאה אחת או שתיים. אסוף כמה שיותר תוכניות שעלו לאחרונה.
          חפש תוכניות עם פוטנציאל ציבורי (פינוי בינוי גדול, תשתיות, הרחבת יישובים).
          
          ${jsonInstruction}
          
          מיפוי שדות:
          date: תאריך ההודעה
          title: שם התוכנית / מספר התוכנית
          description: סוג התוכנית והיישוב
          meta: סטטוס (בהפקדה / למתן תוקף)
        `;
        break;

      // --- רכש (משודרג) ---
      case 'procurement':
        prompt = `
          המשימה: איתור מכרזים ממשלתיים חדשים ובקשות לפטור ממכרז.
          טווח זמן: 28 הימים האחרונים (חובה).
          
          הנחיה: בצע חיפוש Google ממוקד באתר מינהל הרכש.
          שאילתות חובה:
          1. "כוונת התקשרות בפטור ממכרז" site:mr.gov.il
          2. "מכרז פומבי" site:mr.gov.il
          
          ${jsonInstruction}
          
          חפש מכרזים משמעותיים או פטורים חריגים.
          מיפוי שדות:
          date: תאריך פרסום
          title: נושא ההתקשרות
          description: סוג (מכרז/פטור) + פרטים
          meta: המשרד המפרסם
        `;
        break;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using the most powerful model for complex extraction
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Max thinking budget for deep search and processing
        thinkingConfig: { thinkingBudget: 32768 } 
      }
    });

    const rawText = response.text || "[]";
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let items: EditorialItem[] = [];
    try {
      items = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse editorial items JSON:", cleanJson);
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
    const ai = getClient();
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
      
      מילות מפתח לחיפוש: ${topics.join(', ')}.
      גופים/אתרים ספציפיים לסריקה (Entities): ${entitiesText}.
      טווח זמן: ${timeText}.

      המשימה:
      1. סרוק את הרשת אחר חדשות, הודעות לעיתונות, דוחות, ופוסטים ברשתות חברתיות הקשורים למילות המפתח ולגופים שצוינו.
      2. אם סופק כתובת אתר לגוף מסוים, השתמש באופרטור site: כדי לחפש בתוכו. אם לא, חפש את שם הגוף.
      3. התמקד בשינויים דרמטיים, תאריכים קרובים חשובים, ניגודי עניינים פוטנציאליים או הודעות חריגות.

      הנחיה טכנית קריטית (JSON Output Only):
      החזר את התשובה בפורמט JSON בלבד במבנה הבא:
      {
        "executiveSummary": [
           "תובנה קריטית 1 (דגש על תאריך/שינוי מהותי)",
           "תובנה קריטית 2",
           "תובנה קריטית 3"
        ],
        "results": [
          {
            "title": "כותרת הממצא",
            "source": "שם המקור",
            "url": "קישור",
            "date": "תאריך",
            "relevanceScore": 10,
            "relevanceReason": "למה זה חשוב?",
            "summary": "תקציר"
          }
        ]
      }
      אל תוסיף Markdown. אל תוסיף הקדמות.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 4096 }
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
      console.error("Failed to parse JSON from Monitor:", rawText);
      return { executiveSummary: [], results: [] };
    }

  } catch (error) {
    console.error("Error monitoring topics:", error);
    throw error;
  }
};
// ... rest of file (generateDailyBrief, generateConsolidatedReport, processTextWithGemini, etc.) remains unchanged
export const generateDailyBrief = async (categories: BriefCategory[], timeRange: TimeRange): Promise<{ text: string; sources: GroundingSource[] }> => {
  try {
    const ai = getClient();
    let timeText = "";
    switch (timeRange) {
      case '12h': timeText = "ב-12 השעות האחרונות"; break;
      case '24h': timeText = "ביממה האחרונה"; break;
      case '48h': timeText = "ביומיים האחרונים"; break;
      case '72h': timeText = "ב-3 הימים האחרונים"; break;
      case '24h_window': timeText = "ביממה האחרונה"; break;
      default: timeText = "ביממה האחרונה";
    }

    const categoriesText = categories.map(c => {
      switch(c) {
        case 'knesset': return "פעילות כנסת (וועדות ומליאה)";
        case 'legislation': return "הצעות חוק ותזכירים";
        case 'planning': return "תכנון ובנייה";
        case 'procurement': return "מכרזים ממשלתיים";
        case 'news': return "חדשות כלליות";
        default: return c;
      }
    }).join(", ");

    const prompt = `
      אתה עוזר מודיעין לעיתונאי. עליך לייצר דו"ח מודיעין יומי (Daily Brief).
      נושאים לכיסוי: ${categoriesText}.
      טווח זמן: ${timeText}.

      עבור כל נושא שנבחר, סרוק את הרשת (כולל חדשות, אתרי ממשלה, רשתות חברתיות אם אפשר) ומצא את 3-5 הסיפורים החשובים ביותר.
      
      פורמט הדו"ח:
      לכל קטגוריה, צור כותרת (## שם הקטגוריה).
      תחתיה רשימה של בולטים. כל בולט צריך לכלול:
      * **כותרת הסיפור**
      * תמצית קצרה (משפט או שניים).
      * למה זה מעניין? (זווית עיתונאית).

      השתמש בכלי החיפוש כדי למצוא מידע עדכני ואמיתי.
      אם לא נמצא מידע קריטי בקטגוריה מסוימת, ציין "אין דיווחים משמעותיים".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });

    const text = response.text || "לא ניתן לייצר דו\"ח.";
    const sources = extractSources(response);

    return { text, sources };

  } catch (error) {
    console.error("Error generating daily brief:", error);
    throw error;
  }
};

/**
 * Generates a consolidated summary for the Editorial Dashboard
 */
export const generateConsolidatedReport = async (items: string[]): Promise<string> => {
  try {
    const ai = getClient();
    const context = items.join("\n\n-----------------\n\n");
    const prompt = `
      פעל כעורך ראשי של כלי תקשורת מוביל.
      לפניך אוסף ממצאים גולמיים שנאספו ממאגרי מידע שונים (חקיקה, ממשלה, משפט, רכש).
      
      המשימה: הכן מסמך סיכום מסודר ל"ישיבת מערכת".
      
      1. סנן את הרעש: תתמקד רק במה שבאמת חשוב ציבורית או פוליטית.
      2. חבר נקודות: האם יש קשר בין מכרז ברכש לבין החלטת ממשלה? האם דיון בוועדה קשור לחוק חדש?
      3. בנה "ליין-אפ" מוצע: מה צריכה להיות הכותרת הראשית? מה סיפורי הצד?
      
      הממצאים הגולמיים:
      ${context}
      
      הפלט צריך להיות מסודר לפי:
      # הצעת סדר יום לישיבת מערכת
      ## 1. הנושאים הבוערים (Top Priority)
      ## 2. התפתחויות נסתרות (מתחת לרדאר)
      ## 3. הזדמנויות לסיפורי המשך
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "לא ניתן לייצר סיכום.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "שגיאה בייצור הסיכום.";
  }
};

/**
 * New function for Smart Editor features
 */
export const processTextWithGemini = async (text: string, task: 'proofread' | 'summarize' | 'headlines' | 'quotes' | 'to_news'): Promise<string> => {
  let prompt = "";
  switch (task) {
    case 'proofread':
      prompt = `
        אתה עורך לשוני קפדן בעיתון מוביל.
        ערוך את הטקסט הבא: תקן שגיאות כתיב, דקדוק, פיסוק וסגנון. שמור על המהות המקורית אך הפוך את הטקסט לקריא ומקצועי יותר.
        הטקסט:
        "${text}"
      `;
      break;
    case 'summarize':
      prompt = `
        סכם את הטקסט הבא עבור עיתונאי עסוק. צור רשימת בולטים עם הנקודות העיקריות בלבד.
        הטקסט:
        "${text}"
      `;
      break;
    case 'headlines':
      prompt = `
        הצע 5 כותרות עיתונאיות מושכות (קליק-בייט איכותי ומקצועי) עבור הטקסט הבא.
        הטקסט:
        "${text}"
      `;
      break;
    case 'quotes':
      prompt = `
        חלץ מהטקסט את כל הציטוטים הישירים (מרכאות) ואת הדובר שלהם. הצג אותם בצורה מסודרת.
        הטקסט:
        "${text}"
      `;
      break;
    case 'to_news':
      prompt = `
        שכתב את הטקסט הבא (שיכול להיות הודעה לעיתונות, מסמך משפטי או פרוטוקול) לידיעה חדשותית קצרה ("מבזק") מוכנה לפרסום.
        הקפד על מבנה של פירמידה הפוכה: החשוב ביותר בהתחלה.
        הטקסט:
        "${text}"
      `;
      break;
  }

  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text || "לא התקבלה תשובה מהמודל.";
  } catch (error) {
    console.error("Gemini processing error:", error);
    return "אירעה שגיאה בעיבוד הטקסט.";
  }
}

export const editImage = async (imageDataUrl: string, prompt: string): Promise<string> => {
   // Simplified for brevity
   return "";
};

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
