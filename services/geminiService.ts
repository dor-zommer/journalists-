import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingSource, TimeRange, EditorialCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type BriefCategory = 'knesset' | 'legislation' | 'planning' | 'procurement' | 'news';

/**
 * Generates a daily brief with specific focus areas.
 * UPDATED: Focuses on OPEN/ACTIVE items for legislation and planning.
 */
export const generateDailyBrief = async (categories: BriefCategory[], timeRange: TimeRange): Promise<{ text: string; sources: GroundingSource[] }> => {
  try {
    const categoryPrompts = {
      knesset: "סיכום דיונים שהתקיימו בכנסת ופעילות פרלמנטרית מהזמן האחרון.",
      legislation: "אתר החקיקה הממשלתי (תזכירים) - חפש אך ורק תזכירים ש**כרגע פתוחים** להערות הציבור. ציין מתי נסגרת ההרשמה.",
      planning: "אתר 'תכנון זמין' (מינהל התכנון) - חפש אך ורק תוכניות ש**כרגע פתוחות** להתנגדויות הציבור. הדגש תוכניות שמועד ההתנגדות שלהן מסתיים בקרוב.",
      procurement: "אתר מינהל הרכש הממשלתי - בקשות חדשות לפטור ממכרז ומכרזים שפורסמו לאחרונה.",
      news: "חשיפות בלעדיות וסקופים מאתרי החדשות המרכזיים בישראל."
    };

    const selectedPrompts = categories.map(c => categoryPrompts[c]).join('\n');

    let timeText = "24 השעות האחרונות";
    if (timeRange === '12h') timeText = "12 השעות האחרונות";
    if (timeRange === '48h') timeText = "48 השעות האחרונות";
    if (timeRange === '72h') timeText = "72 השעות האחרונות (3 ימים)";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        פעל כעוזר תחקיר עיתונאי בכיר. עליך לייצר דו"ח מודיעין.
        
        עבור חדשות, כנסת ורכש - סרוק את התקופה של ${timeText}.
        עבור חקיקה ותכנון ובנייה - **התעלם מתאריך הפרסום**. המטרה היא למצוא דברים ש**פתוחים כרגע** להערות הציבור או להתנגדויות. תן עדיפות עליונה לפריטים שהדדליין שלהם קרוב (נסגרים בקרוב).
        
        נושאים לסיקור:
        ${selectedPrompts}
        
        הנחיות חשובות:
        1. בחקיקה ותכנון: ציין במפורש את **מועד האחרון** להגשת הערות/התנגדויות. אם נשאר זמן קצר, הדגש זאת ("נותרו יומיים בלבד!").
        2. סדר את המידע לפי כותרות ברורות.
        3. כתוב בעברית עיתונאית, תמציתית ומדויקת.
      `,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "לא נמצא מידע רלוונטי בקטגוריות שנבחרו.";
    const sources = extractSources(response);

    return { text, sources };
  } catch (error) {
    console.error("Error generating daily brief:", error);
    throw error;
  }
};

/**
 * Generates specific list based on category.
 * NOW SPLIT into 5 specific high-fidelity prompts to ensure FULL lists.
 */
export const generateEditorialMeeting = async (timeRange: TimeRange, category: EditorialCategory): Promise<{ text: string; sources: GroundingSource[] }> => {
  try {
    let timeText = "ביממה הקרובה (מחר)";
    if (timeRange === '12h') timeText = "ב-12 השעות הקרובות";
    if (timeRange === '48h') timeText = "ביומיים הקרובים";
    if (timeRange === '72h') timeText = "ב-3 הימים הקרובים";
    if (timeRange === 'week') timeText = "בשבוע הקרוב";

    let prompt = "";

    switch (category) {
      case 'legislation':
        prompt = `
          עליך לבצע סריקה יסודית ומעמיקה באתר החקיקה הממשלתי (תזכירי חוק).
          המשימה שלך: להציג רשימה **מלאה ומקיפה** של כל תזכירי החוק שפתוחים **כרגע** להערות הציבור.
          
          כללי ברזל (אל תפר אותם):
          1. **אסור לסכם**. **אסור לתת דוגמאות**.
          2. אם יש 20 תזכירים פתוחים - הצג את כל ה-20. אם יש 30 - הצג 30.
          3. המשתמש מצפה לראות רשימה ארוכה. חוסר בפריטים ייחשב ככישלון.
          4. חפש במיוחד תזכירים עם המילים "הוראת שעה", "תיקון", "תקנות".
          
          לכל תזכיר ברשימה הצג:
          * שם התזכיר (מודגש)
          * תאריך אחרון להגשת הערות (מודגש)
          * תיאור קצר ביותר (שורה אחת)
        `;
        break;
      
      case 'planning':
        prompt = `
          בצע חיפוש עומק לגבי "תוכניות מתאר פתוחות להתנגדויות" ו"הפקדת תוכניות" (מינהל התכנון, אתר תכנון זמין).
          
          המשימה: ייצר רשימה **מלאה** של כל התוכניות המשמעותיות שפתוחות כרגע להתנגדויות.
          אל תסתפק ב-3-4 תוכניות. אני צריך רשימה של עשרות תוכניות אם קיים מידע.
          
          עבור כל תוכנית:
          * שם/מספר התוכנית
          * יישוב/מיקום
          * מועד אחרון להתנגדות
        `;
        break;

      case 'knesset':
        prompt = `
          הוצא את לוח הזמנים המלא והמדויק של הכנסת לטווח הזמן: ${timeText}.
          
          הנחיות:
          1. עבור ועדה-ועדה (כספים, חוץ וביטחון, חוקה וכו') ורשום את הדיונים.
          2. אל תסנן דיונים שנראים לך "משעממים". הצג את הלו"ז המלא.
          3. אם יש מליאה - פרט את סדר היום.
          
          פורמט:
          - [שעה] **[שם הוועדה]**: [נושא הדיון]
        `;
        break;

      case 'courts':
        prompt = `
          המשימה: איתור יומן הדיונים של בית המשפט העליון (בג"ץ) לטווח הזמן: ${timeText}.

          פעולה ראשונה (חובה):
          בצע חיפוש ממוקד ב-Google באמצעות האופרטור "site:court.gov.il" או "site:supreme.court.gov.il" בשילוב הביטויים: "יומן דיונים", "רשימת דיונים", "יומן בית המשפט העליון", "בג"ץ דיונים".
          נסה למצוא דפי יומן או קבצי PDF שהועלו לאתר הרשמי ומכילים את הלו"ז.

          פעולה שנייה (גיבוי):
          רק אם לא נמצא שום מידע רשמי מהאתר הממשלתי, חפש באתרי משפט וחדשות ("פסקדין", "תקדין", "גלובס", "הארץ") אחר ידיעות על דיונים הצפויים להתקיים ${timeText}.

          הצג את המידע בצורה של רשימה:
          * שעה (אם ידועה)
          * הרכב שופטים (אם ידוע)
          * הצדדים / שם התיק
          * נושא הדיון
        `;
        break;
      
      case 'research':
        prompt = `
          חפש באתר מרכז המידע והמחקר של הכנסת (ממ"מ).
          הוצא רשימה של כל המסמכים, הדוחות והסקירות שפורסמו בשבוע האחרון.
          לכל מסמך ציין את הכותרת ואת התאריך. אל תסנן.
        `;
        break;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Allow higher output tokens to ensure the list isn't cut off
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    const text = response.text || "לא נמצא מידע בטווח הזמן שנבחר.";
    const sources = extractSources(response);

    return { text, sources };

  } catch (error) {
    console.error("Error generating list:", error);
    throw error;
  }
};

/**
 * Monitors specific topics.
 */
export const monitorTopics = async (topics: string[]): Promise<{ text: string; sources: GroundingSource[] }> => {
  if (topics.length === 0) return { text: "לא נבחרו נושאי מעקב.", sources: [] };

  try {
    const prompt = `
      בצע סריקת עומק ברשת עבור הנושאים/מילות המפתח הבאות: ${topics.join(', ')}.
      
      חפש אזכורים חדשים (מה-24 שעות האחרונות) במקורות הבאים:
      1. אתרי חדשות מרכזיים (חשיפות, ידיעות).
      2. אתר החקיקה הממשלתי (תזכירי חוק חדשים בנושאים אלו).
      3. מינהל הרכש (פטורים ממכרז הקשורים לנושאים אלו).
      4. מוסדות תכנון (תוכניות בנייה או התנגדויות הקשורות לנושאים אלו).
      5. פרוטוקולים או הודעות של הכנסת.

      הציג את הממצאים כ"התראות מודיעין" קצרות. לכל התראה ציין את המקור, את המהות, ולמה זה חשוב.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "לא נמצאו עדכונים חדשים בנושאים אלו.";
    const sources = extractSources(response);

    return { text, sources };
  } catch (error) {
    console.error("Error monitoring topics:", error);
    throw error;
  }
};

/**
 * Edits an image using Gemini 2.5 Flash Image.
 */
export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    const base64Data = base64Image.split(',')[1] || base64Image;
    const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';')) || 'image/jpeg';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Edit this image: ${prompt}. Return only the edited image.`
          }
        ]
      }
    });
    
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated in response");

  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
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