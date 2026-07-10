"use client";

import React from "react";
import { Header } from "./Header";
import { Container } from "./Container";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col">
      <Header />
      <main className="flex-1">
        <Container className="py-8">{children}</Container>
      </main>
    </div>
  );
};
