import { vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import HomePage from "./HomePage";

describe("HomePage", () => {
    const toolsMock = [
        { id: 1, name: "Martelo", type: "Ferramenta", dailyPrice: 5, imageUrl: "" },
        { id: 2, name: "Cortador", type: "Ferramenta", dailyPrice: 10, imageUrl: "" }
    ];

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("carrega e mostra ferramentas vindas da API", async () => {
        (global as any).fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => toolsMock
        });

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        expect((global as any).fetch).toHaveBeenCalledWith("/api/tools");

        // espera até que um item apareça no DOM
        expect(await screen.findByText("Martelo")).toBeInTheDocument();
        expect(screen.getByText("Cortador")).toBeInTheDocument();
    });

    test("filtra resultados ao pesquisar", async () => {
        (global as any).fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => toolsMock
        });

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        await screen.findByText("Martelo");

        const input = screen.getByPlaceholderText("O que pretende alugar?");
        await userEvent.type(input, "Martelo");

        // apenas Martelo deve aparecer
        expect(screen.getByText("Martelo")).toBeInTheDocument();
        expect(screen.queryByText("Cortador")).toBeNull();
        expect(screen.getByText(/Resultados da pesquisa/)).toBeInTheDocument();
    });

    test("botões de scroll chamam scrollBy no carrossel", async () => {
        (global as any).fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => toolsMock
        });

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        await screen.findByText("Martelo");

        const scrollByMock = vi.fn();
        // mock do método usado pelo carrossel
        (Element.prototype as any).scrollBy = scrollByMock;

        const btnLeft = screen.getByLabelText("Ver anteriores");
        const btnRight = screen.getByLabelText("Ver seguintes");

        await userEvent.click(btnRight);
        await userEvent.click(btnLeft);

        expect(scrollByMock).toHaveBeenCalled();
        expect(scrollByMock).toHaveBeenCalledTimes(2);
    });
});