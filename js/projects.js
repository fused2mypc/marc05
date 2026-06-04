import { videoData } from "./data.js";

const projectList = document.getElementById("project-list");

function buildProjects() {
  videoData.forEach((video) => {

    const card = document.createElement("div");

    card.className =
      `project-tile ${video.orientation}`;

    card.innerHTML = `
      <img
        src="${video.thumbnail}"
        alt="${video.title}"
      >

      <div class="project-overlay">

        <span class="video-runtime">
          ${video.runtime || ""}
        </span>

        <h2>
          ${video.title}
          <small class="video-category">
            ${video.genre || ""}
          </small>
        </h2>

      </div>
    `;

    card.addEventListener("click", () => {
      window.location.href =
        `carousel.html?startId=${video.id}`;
    });

    projectList.appendChild(card);
  });
}

buildProjects();