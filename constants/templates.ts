export const generateResumeHtml = (data: any) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume - ${data.name}</title>
    <style>
        body {
            font-family: 'Helvetica', sans-serif;
            margin: 40px;
            color: #333;
            line-height: 1.6;
        }
        header {
            text-align: center;
            border-bottom: 2px solid #6366f1;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        h1 {
            color: #1e1b4b;
            margin: 0;
            font-size: 32px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .contact {
            color: #6366f1;
            font-weight: 600;
            margin-top: 5px;
        }
        section {
            margin-bottom: 25px;
        }
        h2 {
            border-left: 4px solid #6366f1;
            padding-left: 10px;
            color: #1e1b4b;
            text-transform: uppercase;
            font-size: 18px;
            margin-bottom: 15px;
        }
        .item {
            margin-bottom: 15px;
        }
        .item-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            color: #1e1b4b;
        }
        .item-title {
            font-size: 16px;
        }
        .item-company {
            color: #6366f1;
            font-style: italic;
        }
        .item-date {
            color: #666;
            font-size: 14px;
        }
        .description {
            margin-top: 5px;
            font-size: 14px;
        }
        .skills-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .skill-tag {
            background: #f3f4f6;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 13px;
            border: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <header>
        <h1>${data.name || 'Your Name'}</h1>
        <div class="contact">
            ${data.email || 'email@example.com'} | ${data.phone || 'Phone'} | ${data.location || 'Location'}
        </div>
    </header>

    <section>
        <h2>Professional Summary</h2>
        <div class="description">
            ${data.summary || 'Summary goes here...'}
        </div>
    </section>

    <section>
        <h2>Experience</h2>
        <div class="item">
            <div class="item-header">
                <span class="item-title">${data.role || 'Senior Developer'}</span>
                <span class="item-date">${data.period || '2020 - Present'}</span>
            </div>
            <div class="item-company">${data.company || 'Tech Corp'}</div>
            <div class="description">
                ${data.experienceDetails || 'Led teams and developed premium products using modern technology stacks.'}
            </div>
        </div>
    </section>

    <section>
        <h2>Technical Skills</h2>
        <div class="skills-list">
            ${(data.skills || ['React', 'TypeScript', 'Node.js', 'Firebase']).map((skill: string) => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
    </section>

    <section>
        <h2>Education</h2>
        <div class="item">
            <div class="item-header">
                <span class="item-title">${data.degree || 'B.S. Computer Science'}</span>
                <span class="item-date">${data.gradDate || '2019'}</span>
            </div>
            <div class="item-company">${data.university || 'State University'}</div>
        </div>
    </section>
</body>
</html>
  `;
};
