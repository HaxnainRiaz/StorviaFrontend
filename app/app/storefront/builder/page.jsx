import ImportedStoreManager from "@/components/storvia/ImportedStoreManager";

export default async function BuilderPage({ searchParams }) {
    const params = await searchParams;
    const panel = params?.panel || "content";
    const tabByPanel = {
        sections: "content",
        theme: "colors",
        navigation: "navigation",
        links: "links",
        preview: "preview",
    };
    return <ImportedStoreManager initialTab={tabByPanel[panel] || "content"} />;
}
