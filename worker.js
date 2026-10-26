const corsHeaders = {
  "Access-Control-Allow-Origin": "https://kettantanmen-byte.github.io",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname !== "/api/search") {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const query = (url.searchParams.get("q") || "").trim();

    if (!query) {
      return new Response(JSON.stringify({
        error: "検索キーワードを入力してください。"
      }), { status: 400, headers: corsHeaders });
    }

    if (!env.YAHOO_APP_ID) {
      return new Response(JSON.stringify({
        error: "API設定がまだ完了していません。"
      }), { status: 500, headers: corsHeaders });
    }

    const apiUrl = new URL(
      "https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch"
    );

    apiUrl.searchParams.set("appid", env.YAHOO_APP_ID);
    apiUrl.searchParams.set("query", query);
    apiUrl.searchParams.set("results", "20");
    apiUrl.searchParams.set("sort", "+price");
    apiUrl.searchParams.set("in_stock", "true");

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        return new Response(JSON.stringify({
          error: "Yahoo!ショッピングAPIでエラーが発生しました。",
          status: response.status
        }), { status: 502, headers: corsHeaders });
      }

      const data = await response.json();

      const items = (data.hits || []).map(item => ({
        name: item.name || "",
        price: Number(item.price || 0),
        image: item.image?.medium || item.image?.small || "",
        url: item.url || "",
        shop: item.seller?.name || "",
        code: item.code || "",
        source: "Yahoo!ショッピング"
      }));

      return new Response(JSON.stringify({
        query,
        count: items.length,
        items
      }), { headers: corsHeaders });

    } catch {
      return new Response(JSON.stringify({
        error: "商品データを取得できませんでした。"
      }), { status: 502, headers: corsHeaders });
    }
  }
};
