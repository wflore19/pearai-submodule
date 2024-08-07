import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postToIde } from "../../util/ide";
import { setLocalStorage } from "../../util/localStorage";
import { Div } from "./components";
import { greenButtonColor } from "../../components";


enum ModelType {
  PearAI,
  Other,
}

function Onboarding() {
  const [hovered, setHovered] = useState(-1);
  const navigate = useNavigate();

  const handleSelect = (selectedModel: ModelType) => {
    postToIde("completeOnboarding", {
      mode: "optimized" as any,
    });
    setLocalStorage("onboardingComplete", true);

    switch (selectedModel) {
      case ModelType.PearAI:
        navigate("/modelconfig/pearaiserver", { state: { referrer: "/onboarding" } });
        break;
      case ModelType.Other:
        navigate("/models", { state: { showOtherProviders: true, referrer: "/onboarding" } });
        break;
      default:
        break;
    }
  };

  return (
    <div className="p-2 max-w-96 mt-10 mx-auto">
      <h1 className="text-center">Welcome to PearAI!</h1>
      <p className="text-center pb-2">
        Select one of the following providers to get setup! Don't worry, this can always be changed later.
      </p>

      <br></br>
      <Div
        color={greenButtonColor} 
        disabled={false}
        selected={false}
        hovered={hovered === ModelType.PearAI}
        onClick={() => handleSelect(ModelType.PearAI)}
        onMouseEnter={() => setHovered(ModelType.PearAI)}
        onMouseLeave={() => setHovered(-1)}
      >
        <div className="flex items-center">
          <img src={`${window.vscMediaUrl}/logos/pearai-color.png`} className="mr-1" height="24px"></img>
          <h3>PearAI Server (Recommended) </h3>
        </div>
        <p className="mt-0">
          Use PearAI's hosted services for convenient, fully-managed integration, with the current best-in-market language models.
        </p>
        <p className="mt-0">
          Code is not stored, and only passes through our server to the model provider.
        </p>
      </Div>
      <br></br>
      <Div
        color={greenButtonColor} 
        disabled={false}
        selected={false}
        hovered={hovered === ModelType.Other} 
        onClick={() => handleSelect(ModelType.Other)}
        onMouseEnter={() => setHovered(ModelType.Other)}
        onMouseLeave={() => setHovered(-1)}
      >
        <h3>⚙️ Other Providers</h3>
        <p>
          Use your own API key for different cloud, local, and other LLM providers (i.e. OpenAI).
        </p>
      </Div>
    </div>
  );
}

export default Onboarding;
