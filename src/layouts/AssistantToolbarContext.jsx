import { createContext, useContext, useEffect } from "react";

export const AssistantToolbarContext = createContext({
    toolbar: null,
    setToolbar: () => {},
    clearToolbar: () => {},
});

export function useAssistantToolbarContext() {
    return useContext(AssistantToolbarContext);
}

export function useAssistantToolbar(config) {
    const { setToolbar, clearToolbar } = useAssistantToolbarContext();

    useEffect(() => {
        if (!config) {
            clearToolbar();
            return undefined;
        }

        setToolbar(config);

        return () => {
            clearToolbar();
        };
    }, [clearToolbar, config, setToolbar]);
}
