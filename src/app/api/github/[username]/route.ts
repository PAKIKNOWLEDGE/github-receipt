import { NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";

function getHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  if (!username || /[^\w.-]/.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  try {
    const headers = getHeaders();

    // Fetch user info
    const userRes = await fetch(`${GITHUB_API}/users/${username}`, { headers });
    if (!userRes.ok) {
      const status = userRes.status;
      if (status === 404) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      if (status === 403) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Try again later." },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status }
      );
    }
    const userData = await userRes.json();

    // Fetch repos (up to 100)
    const reposRes = await fetch(
      `${GITHUB_API}/users/${username}/repos?per_page=100`,
      { headers }
    );
    const reposData = await reposRes.json();

    // Fetch commits from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

    const commitsRes = await fetch(
      `${GITHUB_API}/search/commits?q=author:${username}+committer-date:>=${dateStr}`,
      { headers }
    );
    const commitsData = await commitsRes.json();

    // Compute stats
    const languages: Record<string, number> = {};
    let starsEarned = 0;
    let repoForks = 0;

    for (const repo of reposData) {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
      starsEarned += repo.stargazers_count || 0;
      repoForks += repo.forks_count || 0;
    }

    const topLanguages = Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([lang]) => lang)
      .join(", ");

    const profileScore =
      (userData.public_repos || 0) +
      (userData.public_gists || 0) +
      (userData.followers || 0) +
      (userData.following || 0) +
      starsEarned;

    return NextResponse.json({
      name: userData.name || username,
      login: userData.login,
      public_repos: userData.public_repos,
      public_gists: userData.public_gists,
      followers: userData.followers,
      following: userData.following,
      topLanguages: topLanguages || "N/A",
      commits30d: commitsData.total_count || 0,
      starsEarned,
      repoForks,
      profileScore,
    });
  } catch (error) {
    console.error("GitHub API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
