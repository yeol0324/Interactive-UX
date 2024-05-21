import { Suspense, useState, useTransition } from "react";
import LottiePage from "./lottie/index.tsx";
import Layout from "./Layout.tsx";
import { Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <Suspense fallback={<BigSpinner />}>
      <Layout isPending={true}>
        <Routes>
          <Route path="/" element={<div>this is animation project</div>} />
          <Route path="/lottie" element={<LottiePage />} />
        </Routes>
      </Layout>
    </Suspense>
  );
}

function BigSpinner() {
  return <h2>🌀 Loading...</h2>;
}
